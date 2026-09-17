package com.guardrails.presentation.viewmodel

import com.guardrails.data.remote.UserApiClient
import com.guardrails.data.repository.UserRepositoryImpl

/**
 * DEMO VIOLATION: this presentation-layer class instantiates a `data` repository
 * implementation directly, bypassing the `domain` abstraction entirely. Konsist's
 * layer test (`ArchitectureTest.kt`) must fail the build on this file.
 */
class UserProfileViewModel {

    private val userRepository = UserRepositoryImpl(UserApiClient())

    fun loadProfile(id: String): String {
        val user = userRepository.getUser(id)
        return "${user.displayName} <${user.email}>"
    }
}
