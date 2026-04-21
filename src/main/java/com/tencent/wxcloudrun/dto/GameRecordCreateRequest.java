package com.tencent.wxcloudrun.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public class GameRecordCreateRequest {

  @NotBlank(message = "nickname is required")
  private String nickname;

  @NotNull(message = "score is required")
  @Min(0)
  private Integer score;

  @NotNull(message = "cleared is required")
  private Boolean cleared;

  @NotNull(message = "levelReached is required")
  @Min(1)
  @Max(2)
  private Integer levelReached;

  @NotNull(message = "elapsedSeconds is required")
  @Min(0)
  private Integer elapsedSeconds;

  public String getNickname() {
    return nickname;
  }

  public void setNickname(String nickname) {
    this.nickname = nickname;
  }

  public Integer getScore() {
    return score;
  }

  public void setScore(Integer score) {
    this.score = score;
  }

  public Boolean getCleared() {
    return cleared;
  }

  public void setCleared(Boolean cleared) {
    this.cleared = cleared;
  }

  public Integer getLevelReached() {
    return levelReached;
  }

  public void setLevelReached(Integer levelReached) {
    this.levelReached = levelReached;
  }

  public Integer getElapsedSeconds() {
    return elapsedSeconds;
  }

  public void setElapsedSeconds(Integer elapsedSeconds) {
    this.elapsedSeconds = elapsedSeconds;
  }
}
