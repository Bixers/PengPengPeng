package com.tencent.wxcloudrun.service;

import com.tencent.wxcloudrun.dao.GameRecordMapper;
import com.tencent.wxcloudrun.dto.GameConfigResponse;
import com.tencent.wxcloudrun.dto.GameRecordCreateRequest;
import com.tencent.wxcloudrun.dto.GameRecordResponse;
import com.tencent.wxcloudrun.model.GameRecord;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.text.SimpleDateFormat;
import java.util.Date;

@Service
public class GameService {

  private static final List<String> TILE_LABELS = Arrays.asList(
      "一筒", "二筒", "三筒", "四筒", "五筒", "六筒", "七筒", "八筒", "九筒", "东", "南", "西", "北", "中", "发", "白", "春", "夏", "秋", "冬"
  );

  private final GameRecordMapper gameRecordMapper;

  public GameService(GameRecordMapper gameRecordMapper) {
    this.gameRecordMapper = gameRecordMapper;
  }

  public GameConfigResponse getConfig() {
    GameConfigResponse response = new GameConfigResponse();
    response.setTotalTimeSeconds(12 * 60);
    response.setTileLabels(TILE_LABELS);

    List<GameConfigResponse.LevelConfig> levels = new ArrayList<>();
    levels.add(level(1, 4, 4, 4));
    levels.add(level(2, 10, 12, 12));
    response.setLevels(levels);
    return response;
  }

  public List<GameRecordResponse> getTopRecords(int limit) {
    int safeLimit = Math.max(1, Math.min(limit, 50));
    List<GameRecord> records = gameRecordMapper.selectTop(safeLimit);
    List<GameRecordResponse> responses = new ArrayList<>();
    for (GameRecord record : records) {
      responses.add(toResponse(record));
    }
    return responses;
  }

  public GameRecordResponse saveRecord(GameRecordCreateRequest request) {
    GameRecord record = new GameRecord();
    record.setNickname(sanitizeNickname(request.getNickname()));
    record.setScore(request.getScore());
    record.setCleared(Boolean.TRUE.equals(request.getCleared()));
    record.setLevelReached(request.getLevelReached());
    record.setElapsedSeconds(request.getElapsedSeconds());
    gameRecordMapper.insert(record);
    return toResponse(record);
  }

  private String sanitizeNickname(String nickname) {
    String value = nickname == null ? "" : nickname.trim();
    if (value.isEmpty()) {
      return "玩家";
    }
    if (value.length() > 16) {
      return value.substring(0, 16);
    }
    return value;
  }

  private GameConfigResponse.LevelConfig level(int level, int rows, int cols, int uniqueTypes) {
    GameConfigResponse.LevelConfig config = new GameConfigResponse.LevelConfig();
    config.setLevel(level);
    config.setRows(rows);
    config.setCols(cols);
    config.setUniqueTypes(uniqueTypes);
    return config;
  }

  private GameRecordResponse toResponse(GameRecord record) {
    GameRecordResponse response = new GameRecordResponse();
    response.setId(record.getId());
    response.setNickname(record.getNickname());
    response.setScore(record.getScore());
    response.setCleared(record.getCleared());
    response.setLevelReached(record.getLevelReached());
    response.setElapsedSeconds(record.getElapsedSeconds());
    response.setCreatedAt(formatDate(record.getCreatedAt()));
    return response;
  }

  private String formatDate(Date date) {
    if (date == null) {
      return null;
    }
    return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(date);
  }
}
