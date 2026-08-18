import logging
from threading import Thread

import pytest

from sparkmonitor import kernelextension
from sparkmonitor.kernelextension import (
    get_listener_jar_path,
    get_spark_versions,
)


@pytest.fixture
def fake_spark_home(tmp_path):
    """Create a temporary SPARK_HOME with a jars directory."""
    (tmp_path / "jars").mkdir()
    return tmp_path


def _create_jar(spark_home, jar_name):
    (spark_home / "jars" / jar_name).touch()


class TestGetSparkVersions:
    def test_spark3_scala_212(self, fake_spark_home, monkeypatch):
        _create_jar(fake_spark_home, "spark-core_2.12-3.5.6.jar")
        monkeypatch.setenv("SPARK_HOME", str(fake_spark_home))
        assert get_spark_versions() == ("3", "2.12")

    def test_spark3_scala_213(self, fake_spark_home, monkeypatch):
        _create_jar(fake_spark_home, "spark-core_2.13-3.5.8.jar")
        monkeypatch.setenv("SPARK_HOME", str(fake_spark_home))
        assert get_spark_versions() == ("3", "2.13")

    def test_spark4_scala_213(self, fake_spark_home, monkeypatch):
        _create_jar(fake_spark_home, "spark-core_2.13-4.1.1.jar")
        monkeypatch.setenv("SPARK_HOME", str(fake_spark_home))
        assert get_spark_versions() == ("4", "2.13")


class TestGetListenerJarPath:
    def test_spark3_scala_212_uses_212_jar(self):
        assert get_listener_jar_path("3", "2.12").endswith("/listener_spark3_2.12.jar")

    def test_spark3_scala_213_uses_spark3_jar(self):
        assert get_listener_jar_path("3", "2.13").endswith("/listener_spark3_2.13.jar")

    def test_spark4_scala_213_uses_default_213_jar(self):
        assert get_listener_jar_path("4", "2.13").endswith("/listener_spark4_2.13.jar")

    def test_unknown_spark_major_returns_empty_path(self):
        assert get_listener_jar_path("5", "2.13") == ""

    def test_unknown_scala_version_returns_empty_path(self):
        assert get_listener_jar_path("3", "2.11") == ""


class FakeComm:
    """Records messages sent to the frontend."""

    def __init__(self):
        self.sent = []

    def send(self, msg):
        self.sent.append(msg)

    def on_msg(self, callback):
        return callback


@pytest.fixture
def monitor(monkeypatch):
    monkeypatch.setattr(kernelextension, "logger", logging.getLogger("test"), raising=False)
    return kernelextension.ScalaMonitor(ipython=None)


class TestScalaMonitorComm:
    def test_send_before_comm_opens_is_buffered(self, monitor):
        monitor.send({"msgtype": "early"})
        assert monitor.pending == [{"msgtype": "early"}]

    def test_commopen_is_sent_before_buffered_messages(self, monitor):
        monitor.send({"msgtype": "early"})
        comm = FakeComm()
        monitor.target_func(comm, msg=None)
        assert comm.sent == [{"msgtype": "commopen"}, {"msgtype": "early"}]

    def test_buffer_is_emptied_after_flush(self, monitor):
        monitor.send({"msgtype": "early"})
        monitor.target_func(FakeComm(), msg=None)
        assert monitor.pending == []

    def test_send_after_comm_opens_goes_directly_to_the_comm(self, monitor):
        comm = FakeComm()
        monitor.target_func(comm, msg=None)
        monitor.send({"msgtype": "late"})
        assert comm.sent == [{"msgtype": "commopen"}, {"msgtype": "late"}]

    def test_send_during_flush_is_delivered_after_buffered_messages(self, monitor):
        """A message arriving while the buffer is being flushed must wait for
        the flush and be delivered afterwards, not lost or reordered."""
        monitor.send({"msgtype": "early"})

        senders = []

        class CommOpenedDuringSend(FakeComm):
            def send(self, msg):
                super().send(msg)
                if msg == {"msgtype": "early"}:
                    # a concurrent send during the flush blocks until the
                    # flush completes because target_func holds the lock
                    sender = Thread(target=monitor.send, args=({"msgtype": "during-flush"},))
                    sender.start()
                    senders.append(sender)

        comm = CommOpenedDuringSend()
        monitor.target_func(comm, msg=None)
        for sender in senders:
            sender.join(timeout=10)
        assert comm.sent == [
            {"msgtype": "commopen"},
            {"msgtype": "early"},
            {"msgtype": "during-flush"},
        ]
