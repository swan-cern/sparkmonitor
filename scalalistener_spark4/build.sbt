/***********************
 *  project settings   *
 ***********************/
organization := "CERN"
version      := "2.0"
licenses    += ("Apache-2.0", url("https://www.apache.org/licenses/LICENSE-2.0"))

name := "sparkmonitor"

scalaVersion        := "2.13.16"

/***************************************
 *   runtime / compile dependencies    *
 ***************************************/
libraryDependencies ++= Seq(
  "org.apache.spark" %% "spark-sql"  % "4.0.0" % Provided
)

/******************************************
 *   Custom thin‑JAR artefact location    *
 ******************************************/
Compile / packageBin / artifactPath := {
  val bin = CrossVersion.binaryScalaVersion(scalaVersion.value)
  baseDirectory.value / ".." / "sparkmonitor" / s"listener_$bin.jar"
}
