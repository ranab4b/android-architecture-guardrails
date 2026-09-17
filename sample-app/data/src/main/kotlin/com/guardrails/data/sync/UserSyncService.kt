package com.guardrails.data.sync

import com.guardrails.data.remote.UserApiClient

class UserSyncService(private val apiClient: UserApiClient) {

    fun syncUser(id: String): String {
        val dto = apiClient.fetchUser(id)
        return formatForBadge(dto.name, dto.email)
    }

    private fun formatForBadge(name: String, email: String): String {
        val initials = name.split(" ").mapNotNull { it.firstOrNull() }.joinToString("")
        return "$initials · $email".uppercase()
    }
}
