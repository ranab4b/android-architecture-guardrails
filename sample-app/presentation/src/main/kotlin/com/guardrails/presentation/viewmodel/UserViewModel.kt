package com.guardrails.presentation.viewmodel

import com.guardrails.domain.usecase.GetUserUseCase

class UserViewModel(private val getUserUseCase: GetUserUseCase) {

    var displayText: String = ""
        private set

    fun loadUser(id: String) {
        val user = getUserUseCase(id)
        displayText = "${user.displayName} <${user.email}>"
    }
}
