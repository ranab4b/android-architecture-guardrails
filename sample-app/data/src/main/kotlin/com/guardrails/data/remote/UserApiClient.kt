package com.guardrails.data.remote

/**
 * Stand-in for a Retrofit/Ktor client. Framework networking types are intentionally
 * kept out of the domain layer and confined here.
 */
class UserApiClient {
    fun fetchUser(id: String): UserDto = UserDto(
        id = id,
        name = "User $id",
        email = "user-$id@example.com"
    )
}

data class UserDto(
    val id: String,
    val name: String,
    val email: String
)
