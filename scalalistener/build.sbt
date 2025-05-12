import sbtassembly.AssemblyPlugin.autoImport._   // single, unambiguous import

/***********************
 *  project settings   *
 ***********************/
organization := "CERN"
version      := "1.1"
licenses    += ("Apache-2.0", url("https://www.apache.org/licenses/LICENSE-2.0"))

name := "sparkmonitor"

scalaVersion        := "2.12.18"
crossScalaVersions  := Seq("2.12.18", "2.13.8")

/***************************************
 *   runtime / compile dependencies    *
 ***************************************/
libraryDependencies ++= Seq(
  "org.apache.spark" %% "spark-core" % "3.5.5" % Provided,
  "org.apache.spark" %% "spark-sql"  % "3.5.5" % Provided
)

/*****************************************************************
 *  1. where the **thin** JAR from `package` should be written   *
 *****************************************************************/
Compile / packageBin / artifactPath := {
  val bin = CrossVersion.binaryScalaVersion(scalaVersion.value)
  baseDirectory.value / ".." / "sparkmonitor" / s"listener_$bin.jar"
}

/*****************************************************************
 *  2. where the **fat** JAR from `assembly` should be written   *
 *****************************************************************/
assembly / assemblyOutputPath := (Compile / packageBin / artifactPath).value

