# -*- coding: utf-8 -*-
"""SparkMonitor IPython Kernel Extension

Receives data from listener and forwards to frontend.
Adds a configuration object to users namespace.
"""
from __future__ import absolute_import
from __future__ import unicode_literals

import logging
import os
import socket
from pathlib import Path
from threading import Thread

ipykernel_imported = True
spark_imported = True
try:
    from ipykernel import zmqshell
except ImportError:
    ipykernel_imported = False

try:
    from pyspark import SparkConf
except ImportError:
    try:
        import findspark
        findspark.init()
        from pyspark import SparkConf
    except Exception:
        spark_imported = False


class ScalaMonitor:
    """Main singleton object for the kernel extension"""

    def __init__(self, ipython):
        """Constructor

        ipython is the instance of ZMQInteractiveShell
        """
        self.ipython = ipython

    def start(self):
        """Creates the socket thread and returns assigned port"""
        self.scalaSocket = SocketThread()
        return self.scalaSocket.startSocket()  # returns the port

    def getPort(self):
        """Return the socket port"""
        return self.scalaSocket.port

    def send(self, msg):
        """Send a message to the frontend"""
        self.comm.send(msg)

    def handle_comm_message(self, msg):
        """Handle message received from frontend

        Does nothing for now as this only works if kernel is not busy.
        """
        logger.debug('COMM MESSAGE:  \n %s', str(msg))

    def register_comm(self):
        """Register a comm_target which will be used by
        frontend to start communication."""
        self.ipython.kernel.comm_manager.register_target(
            'SparkMonitor', self.target_func)

    def target_func(self, comm, msg):
        """Callback function to be called when a frontend comm is opened"""
        logger.info('SparkMonitor comm opened from frontend.')
        self.comm = comm

        @self.comm.on_msg
        def _recv(msg):
            self.handle_comm_message(msg)
        comm.send({'msgtype': 'commopen'})


class SocketThread(Thread):
    """Class to manage a socket in a background thread
    to talk to the scala listener."""

    def __init__(self):
        """Constructor, initializes base class Thread."""
        self.port = 0
        Thread.__init__(self)

    def startSocket(self):
        """Starts a socket on a random port and starts
        listening for connections"""
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.bind(('localhost', self.port))
        self.sock.listen(5)
        self.port = self.sock.getsockname()[1]
        logger.info('Socket Listening on port %s', str(self.port))
        self.start()
        return self.port

    def run(self):
        """Overrides Thread.run

        Creates a socket and waits(blocking) for connections
        When a connection is closed, goes back into waiting.
        """
        while(True):
            logger.info('Starting socket thread, going to accept')
            (client, addr) = self.sock.accept()
            logger.info('Client Connected %s', addr)
            totalMessage = ''
            while True:
                messagePart = client.recv(4096)
                if not messagePart:
                    logger.info('Scala socket closed - empty data')
                    break
                totalMessage += messagePart.decode()
                # Messages are ended with ;EOD:
                pieces = totalMessage.split(';EOD:')
                totalMessage = pieces[-1]
                messages = pieces[:-1]
                for msg in messages:
                    logger.debug('Message Received: \n%s\n', msg)
                    self.onrecv(msg)
            logger.info('Socket Exiting Client Loop')
            try:
                client.shutdown(socket.SHUT_RDWR)
            except OSError:
                client.close()

    def start(self):
        """Starts the socket thread"""
        Thread.start(self)

    def sendToScala(self, msg):
        """Send a message through the socket."""
        return self.socket.send(msg)

    def onrecv(self, msg):
        """Forwards all messages to the frontend"""
        sendToFrontEnd({
            'msgtype': 'fromscala',
            'msg': msg
        })


def load_ipython_extension(ipython):
    """Entrypoint, called when the extension is loaded.

    ipython is the InteractiveShell instance
    """
    global ip, monitor  # For Debugging

    global logger
    logger = logging.getLogger('tornado.sparkmonitor.kernel')
    logger.name = 'SparkMonitorKernel'
    logger.setLevel(logging.INFO)
    logger.propagate = True

    if ipykernel_imported:
        if not isinstance(ipython, zmqshell.ZMQInteractiveShell):
            logger.warn(
                'SparkMonitor: Ipython not running through notebook')
            return
    else:
        return

    ip = ipython
    logger.info('Starting Kernel Extension')
    monitor = ScalaMonitor(ip)
    monitor.register_comm()  # Communication to browser
    monitor.start()

    # Injecting conf into users namespace
    if spark_imported:
        # Get conf if user already has a conf for appending
        conf = ipython.user_ns.get('conf')
        if conf:
            logger.info('Conf: ' + conf.toDebugString())
            if isinstance(conf, SparkConf):
                configure(conf)
        else:
            conf = SparkConf()  # Create a new conf
            configure(conf)
            ipython.push({
                'conf': conf, 
                'swan_spark_conf': conf # For backward compatibility with fork
                })  # Add to users namespace


def configure(conf):
    """Configures the provided conf object.

    Sets the Java Classpath and listener jar file path to "conf".
    Also sets an environment variable for ports for communication
    with scala listener.
    """
    global monitor
    port = monitor.getPort()
    logger.info('SparkConf Configured, Starting to listen on port:', str(port))
    os.environ['SPARKMONITOR_KERNEL_PORT'] = str(port)
    logger.info(os.environ['SPARKMONITOR_KERNEL_PORT'])
    spark_version, spark_scala_version = get_spark_versions()
    jarpath = get_listener_jar_path(spark_version, spark_scala_version)
    if jarpath:
        logger.info('Adding jar from %s ', jarpath)
        conf.set('spark.driver.extraClassPath', jarpath)
        conf.set('spark.extraListeners', 'sparkmonitor.listener.JupyterSparkMonitorListener')
    else:
        logger.warn("Unknown Spark/Scala version skipped configuring listener jar.")


def sendToFrontEnd(msg):
    """Send a message to the frontend through the singleton monitor object."""
    global monitor
    monitor.send(msg)


def get_spark_versions():
    """Determine Spark major version and Scala version from SPARK_HOME jars.

    Returns a tuple of (spark_major, scala_version), e.g. ("3", "2.13").
    """
    spark_home = os.environ.get('SPARK_HOME', '')
    for jar in Path(spark_home, 'jars').glob('spark-core_*.jar'):
        # spark-core_2.12-3.5.6.jar => scala="2.12", spark_major="3"
        # spark-core_2.13-4.1.1.jar => scala="2.13", spark_major="4"
        name_parts = jar.name.split('_')[1].split('-')
        scala_ver = name_parts[0]
        spark_major = name_parts[1].split('.')[0] if len(name_parts) > 1 else ""
        return spark_major, scala_ver
    return "", ""


def get_listener_jar_path(spark_major, scala_version):
    """Return listener jar path for the detected Spark/Scala combination."""
    base_path = os.path.abspath(os.path.dirname(__file__))
    if spark_major == "3" and scala_version == "2.12":
        return base_path + "/listener_spark3_2.12.jar"
    if spark_major == "3" and scala_version == "2.13":
        return base_path + "/listener_spark3_2.13.jar"
    if spark_major == "4" and scala_version == "2.13":
        return base_path + "/listener_spark4_2.13.jar"
    return ""
