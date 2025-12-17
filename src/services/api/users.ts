// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type { UserResponse, MeResponse } from "@/services/models"

export class UsersApiClient extends BaseApiClient {
  getUsers(token: string) {
    appLogger.debug("Fetching users list")
    return this.requestWithToken<UserResponse[]>("/users/", token)
  }

  getMeUsers(token: string) {
    appLogger.debug("Fetching current user information")
    return this.requestWithToken<MeResponse>("/users/me", token)
  }

  createUser(
    token: string,
    payload: {
      id: number
      username: string
      password: string
      email?: string
      is_active: boolean
      is_admin: boolean
    }
  ) {
    appLogger.debug("Sending POST request to create user", undefined, {
      username: payload.username,
    })

    return this.requestWithToken<void>(
      "/users/",
      token,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { parseJson: false }
    )
  }

  changeMyPassword(
    token: string,
    payload: { current_password: string; new_password: string }
  ) {
    appLogger.debug("Sending PATCH request to change password")

    return this.requestWithToken<void>(
      "/users/me/password",
      token,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { parseJson: false }
    )
  }
}