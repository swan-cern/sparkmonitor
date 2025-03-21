name := "sparkmonitor"

version := "1.1"

scalaVersion := "2.12.18"
crossScalaVersions := Seq("2.12.18", "2.13.8")
organization := "cern"
licenses += ("Apache-2.0", url("http://www.apache.org/licenses/LICENSE-2.0"))

libraryDependencies += "org.apache.spark" %% "spark-sql" % "3.5.5"

Compile / packageBin / artifactPath := {
  val scalaBin = CrossVersion.binaryScalaVersion(scalaVersion.value)
  file(s"../sparkmonitor/listener_$scalaBin.jar")
}
