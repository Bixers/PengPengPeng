package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import com.tencent.wxcloudrun.dto.GameConfigResponse;
import com.tencent.wxcloudrun.dto.GameRecordCreateRequest;
import com.tencent.wxcloudrun.dto.GameRecordResponse;
import com.tencent.wxcloudrun.service.GameService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/game")
public class GameController {

  private final GameService gameService;

  public GameController(GameService gameService) {
    this.gameService = gameService;
  }

  @GetMapping("/config")
  public ApiResponse<GameConfigResponse> config() {
    return ApiResponse.ok(gameService.getConfig());
  }

  @GetMapping("/rankings")
  public ApiResponse<List<GameRecordResponse>> rankings(@RequestParam(value = "limit", defaultValue = "10") int limit) {
    return ApiResponse.ok(gameService.getTopRecords(limit));
  }

  @PostMapping("/records")
  public ApiResponse<GameRecordResponse> saveRecord(@Validated @RequestBody GameRecordCreateRequest request) {
    return ApiResponse.ok(gameService.saveRecord(request));
  }
}
