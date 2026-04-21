package com.tencent.wxcloudrun.dto;

public class GameRecordResponse {

  private Long id;
  private String nickname;
  private Integer score;
  private Boolean cleared;
  private Integer levelReached;
  private Integer elapsedSeconds;
  private String createdAt;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

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

  public String getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(String createdAt) {
    this.createdAt = createdAt;
  }
}
