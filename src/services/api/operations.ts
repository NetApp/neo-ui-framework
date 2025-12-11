// Copyright 2025 NetApp, Inc. All Rights Reserved.
import { appLogger } from "@/services/app-logger"
import { BaseApiClient } from "./base"
import type { OperationResponse } from "@/services/models"

export class OperationsApiClient extends BaseApiClient {
  getOperations(token: string) {
    appLogger.debug("Fetching operations list")
    return this.requestWithToken<OperationResponse[]>("/operations/", token)
  }
}