
import os
import subprocess
import socket
import threading
import logging

import ipykernel.comm

class SocketThread(threading.Thread):
    """Class to manage a socket in a background thread
    to talk to the scala listener."""

    def __init__(self, **kwargs):
        super().__init__()
        self.logger = kwargs['logger']
        
        # Start listening on the socket
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._sock.bind(('localhost', 0))
        self._sock.listen(5)
        self.port = self._sock.getsockname()[1]
        self.logger.info('Socket listening on port %s', str(self.port))
        self.comm: ipykernel.comm.Comm = kwargs['comm']

    def run(self):
        """Overrides Thread.run

        Creates a socket and waits(blocking) for connections
        When a connection is closed, goes back into waiting.
        """
        while(True):
            self.logger.info('Starting socket thread, going to accept')
            (client, addr) = self._sock.accept()
            self.logger.info('Client Connected %s', addr)
            totalMessage = ''
            while True:
                messagePart = client.recv(4096)
                if not messagePart:
                    self.logger.info('Scala socket closed - empty data')
                    break
                totalMessage += messagePart.decode()
                # Messages are ended with ;EOD:
                pieces = totalMessage.split(';EOD:')
                totalMessage = pieces[-1]
                messages = pieces[:-1]
                for msg in messages:
                    self.logger.debug('Message Received: \n%s\n', msg)
                    self._onrecv(msg)
            self.logger.info('Socket Exiting Client Loop')
            try:
                client.shutdown(socket.SHUT_RDWR)
            except OSError:
                client.close()

    def _onrecv(self, msg):
        """Forwards all messages to the frontend"""
        self.comm.send({
            'msgtype': 'fromscala',
            'msg': msg
        })


def _get_spark_scala_version():
    cmd = "pyspark --version 2>&1 | grep -m 1  -Eo '[0-9]*[.][0-9]*[.][0-9]*[,]' | sed 's/,$//'"
    version = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, encoding="utf-8")
    return version.stdout.strip()

def _init_logger():
    logger = logging.getLogger('tornado.sparkmonitor.kernel')
    logger.name = 'SparkMonitorKernel'
    logger.setLevel(logging.INFO)
    logger.propagate = True
    return logger

def connect(conf):
    logger = _init_logger()
    
    # Start a comm with frontend
    comm = ipykernel.comm.Comm(target_name='sparkmonitor-comm-target', data={})
    socketThread = SocketThread(comm=comm, logger=logger)
    os.environ['SPARKMONITOR_KERNEL_PORT'] = str(socketThread.port)
    socketThread.start()

    spark_scala_version = _get_spark_scala_version()
    if "2.11" in spark_scala_version:
        jarpath = os.path.abspath(os.path.dirname(__file__)) + "/listener_2.11.jar"
        logger.info('Adding jar from %s ', jarpath)
        conf.set('spark.driver.extraClassPath', jarpath)
        conf.set('spark.extraListeners', 'sparkmonitor.listener.JupyterSparkMonitorListener')
    elif "2.12" in spark_scala_version:
        jarpath = os.path.abspath(os.path.dirname(__file__)) + "/listener_2.12.jar"
        logger.info('Adding jar from %s ', jarpath)
        conf.set('spark.driver.extraClassPath', jarpath)
        conf.set('spark.extraListeners', 'sparkmonitor.listener.JupyterSparkMonitorListener')
    else:
        logger.warn("Unknown scala version skipped configuring listener jar.")
    
