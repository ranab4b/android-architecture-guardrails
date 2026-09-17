plugins {
    kotlin("jvm")
}

dependencies {
    implementation(project(":sample-app:domain"))
}

kotlin {
    jvmToolchain(17)
}
