/***********************
 *  project settings   *
 ***********************/
organization := "CERN"
version      := "1.2"
licenses    += ("Apache-2.0", url("https://www.apache.org/licenses/LICENSE-2.0"))

name := "sparkmonitor"

scalaVersion        := "2.12.18"

/***************************************
 *   runtime / compile dependencies    *
 ***************************************/
libraryDependencies ++= Seq(
  "org.apache.spark" %% "spark-sql"  % "3.5.5" % Provided
)

/******************************************
 *   Custom thin‑JAR artefact location    *
 ******************************************/
Compile / packageBin / artifactPath := {
  val bin = CrossVersion.binaryScalaVersion(scalaVersion.value)
  baseDirectory.value / ".." / "sparkmonitor" / s"listener_$bin.jar"
}
