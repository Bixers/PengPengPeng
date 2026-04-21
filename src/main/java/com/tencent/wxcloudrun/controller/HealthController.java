package com.tencent.wxcloudrun.controller;

import com.tencent.wxcloudrun.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {

  @GetMapping("/health")
  public ApiResponse<Map<String, Object>> health() {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("name", "pengpengpeng");
    data.put("status", "ok");
    return ApiResponse.ok(data);
  }
}
