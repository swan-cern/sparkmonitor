name := "sparkmonitor"

version := "1.0"

scalaVersion := "2.12.15"
crossScalaVersions := Seq("2.11.12", "2.12.15")
organization := "cern"

val sparkVersion2 = "2.4.7"
val sparkVersion3 = "3.0.1"

libraryDependencies ++= {
  CrossVersion.partialVersion(scalaVersion.value) match {
    case Some((2, 11)) => List(
      "org.apache.spark" %% "spark-core" % sparkVersion2 % "provided",
      "net.sf.py4j" % "py4j" % "0.10.7" % "provided",
      "log4j" % "log4j" % "1.2.17" % "provided",
      "org.json4s" % "json4s-ast_2.11" % "3.7.0-M5",
      ("org.json4s" % "json4s-jackson_2.11" % "3.7.0-M5").exclude("com.fasterxml.jackson.core" , "jackson-databind"),
    )
    case Some((2, 12)) => List(
      "org.apache.spark" %% "spark-core" % sparkVersion3 % "provided" ,
      "net.sf.py4j" % "py4j" % "0.10.7" % "provided",
      "log4j" % "log4j" % "1.2.17" % "provided",
      "org.json4s" % "json4s-ast_2.12" % "3.7.0-M5",
      ("org.json4s" % "json4s-jackson_2.12" % "3.7.0-M5").exclude("com.fasterxml.jackson.core" , "jackson-databind"),
    )
  }
}

ThisBuild / assemblyShadeRules := {
  CrossVersion.partialVersion(scalaVersion.value) match {
    case Some((2, 11)) => Seq(
      ShadeRule.rename("org.json4s.**" -> "ch.cern.swan.org.json4s.@1").inAll
    )
    case Some((2, 12)) => List(
      ShadeRule.rename("org.json4s.**" -> "ch.cern.swan.org.json4s.@1").inAll
    )
  }
}

assembly / assemblyJarName := {
  scalaBinaryVersion.value match {
    case "2.11" => "listener_2.11.jar"
    case "2.12" => "listener_2.12.jar"
  }
}

assembly / assemblyOutputPath := {
  scalaBinaryVersion.value match {
    case "2.11" => (baseDirectory { base => base / ("../sparkmonitor/listener_2.11.jar") }).value
    case "2.12" => (baseDirectory { base => base / ("../sparkmonitor/listener_2.12.jar") }).value
  }
}

ThisBuild / assemblyShadeRules := Seq(
  ShadeRule.rename("org.json4s.**" -> "ch.cern.swan.org.json4s.@1").inAll
)
ThisBuild / assemblyPackageScala / assembleArtifact := false,
