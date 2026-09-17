package com.guardrails.domain.repository

import com.guardrails.domain.model.User

/**
 * Pure abstraction owned by the domain layer.
 * Must never reference framework or networking types (Retrofit, OkHttp, Android SDK, etc.) —
 * enforced by [architecture-tests/src/test/kotlin/ArchitectureTest.kt].
 */
interface UserRepository {
    fun getUser(id: String): User
}
