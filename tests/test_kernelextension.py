import pytest

from sparkmonitor.kernelextension import (
    get_listener_jar_path,
    get_spark_scala_version,
    get_spark_versions,
)


@pytest.fixture
def fake_spark_home(tmp_path):
    """Create a temporary SPARK_HOME with a jars directory."""
    (tmp_path / "jars").mkdir()
    return tmp_path


def _create_jar(spark_home, jar_name):
    (spark_home / "jars" / jar_name).touch()


class TestGetSparkScalaVersion:
    def test_spark3_scala_212(self, fake_spark_home, monkeypatch):
        _create_jar(fake_spark_home, "spark-core_2.12-3.5.6.jar")
        monkeypatch.setenv("SPARK_HOME", str(fake_spark_home))
        assert get_spark_scala_version() == "2.12"

    def test_spark4_scala_213(self, fake_spark_home, monkeypatch):
        _create_jar(fake_spark_home, "spark-core_2.13-4.1.1.jar")
        monkeypatch.setenv("SPARK_HOME", str(fake_spark_home))
        assert get_spark_scala_version() == "2.13"

    def test_no_spark_home(self, monkeypatch):
        assert get_spark_scala_version() == ""

    def test_empty_jars_dir(self, fake_spark_home, monkeypatch):
        monkeypatch.setenv("SPARK_HOME", str(fake_spark_home))
        assert get_spark_scala_version() == ""

    def test_no_jars_dir(self, tmp_path, monkeypatch):
        monkeypatch.setenv("SPARK_HOME", str(tmp_path))
        assert get_spark_scala_version() == ""


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
        assert get_listener_jar_path("3", "2.12").endswith("/listener_2.12.jar")

    def test_spark3_scala_213_uses_spark3_jar(self):
        assert get_listener_jar_path("3", "2.13").endswith("/listener_spark3_2.13.jar")

    def test_spark4_scala_213_uses_default_213_jar(self):
        assert get_listener_jar_path("4", "2.13").endswith("/listener_2.13.jar")

    def test_unknown_spark_major_returns_empty_path(self):
        assert get_listener_jar_path("5", "2.13") == ""

    def test_unknown_scala_version_returns_empty_path(self):
        assert get_listener_jar_path("3", "2.11") == ""
