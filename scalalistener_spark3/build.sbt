/***********************
 *  project settings   *
 ***********************/
organization := "CERN"
version      := "1.2"
licenses    += ("Apache-2.0", url("https://www.apache.org/licenses/LICENSE-2.0"))

name := "sparkmonitor"

scalaVersion := "2.12.18"
crossScalaVersions := Seq("2.12.18", "2.13.16")

/***************************************
 *   runtime / compile dependencies    *
 ***************************************/
libraryDependencies ++= Seq(
  "org.apache.spark" %% "spark-sql" % "3.5.8" % Provided
)

/******************************************
 *   Custom thin-JAR artefact location    *
 ******************************************/
Compile / packageBin / artifactPath := {
  val bin = CrossVersion.binaryScalaVersion(scalaVersion.value)
  val jarName =
    if (bin == "2.13") s"listener_spark3_$bin.jar"
    else s"listener_$bin.jar"

  baseDirectory.value / ".." / "sparkmonitor" / jarName
}
