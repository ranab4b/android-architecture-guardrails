plugins {
    kotlin("jvm")
}

dependencies {
    implementation(project(":sample-app:domain"))
    // DEMO VIOLATION: presentation should never depend on data directly.
    implementation(project(":sample-app:data"))
}

kotlin {
    jvmToolchain(17)
}
