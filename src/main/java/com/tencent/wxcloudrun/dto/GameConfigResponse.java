package com.tencent.wxcloudrun.dto;

import java.util.ArrayList;
import java.util.List;

public class GameConfigResponse {

  private int totalTimeSeconds;
  private List<LevelConfig> levels = new ArrayList<>();
  private List<String> tileLabels = new ArrayList<>();

  public int getTotalTimeSeconds() {
    return totalTimeSeconds;
  }

  public void setTotalTimeSeconds(int totalTimeSeconds) {
    this.totalTimeSeconds = totalTimeSeconds;
  }

  public List<LevelConfig> getLevels() {
    return levels;
  }

  public void setLevels(List<LevelConfig> levels) {
    this.levels = levels;
  }

  public List<String> getTileLabels() {
    return tileLabels;
  }

  public void setTileLabels(List<String> tileLabels) {
    this.tileLabels = tileLabels;
  }

  public static class LevelConfig {
    private int level;
    private int rows;
    private int cols;
    private int uniqueTypes;

    public int getLevel() {
      return level;
    }

    public void setLevel(int level) {
      this.level = level;
    }

    public int getRows() {
      return rows;
    }

    public void setRows(int rows) {
      this.rows = rows;
    }

    public int getCols() {
      return cols;
    }

    public void setCols(int cols) {
      this.cols = cols;
    }

    public int getUniqueTypes() {
      return uniqueTypes;
    }

    public void setUniqueTypes(int uniqueTypes) {
      this.uniqueTypes = uniqueTypes;
    }
  }
}
