package com.guardrails.domain.usecase

import com.guardrails.domain.model.User
import com.guardrails.domain.repository.UserRepository

class GetUserUseCase(private val userRepository: UserRepository) {
    operator fun invoke(id: String): User = userRepository.getUser(id)
}
