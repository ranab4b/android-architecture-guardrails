package com.guardrails.data.repository

import com.guardrails.data.remote.UserApiClient
import com.guardrails.domain.model.User
import com.guardrails.domain.repository.UserRepository

class UserRepositoryImpl(private val apiClient: UserApiClient) : UserRepository {
    override fun getUser(id: String): User {
        val dto = apiClient.fetchUser(id)
        return User(id = dto.id, displayName = dto.name, email = dto.email)
    }
}
