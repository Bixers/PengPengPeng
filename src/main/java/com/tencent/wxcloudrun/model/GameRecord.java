package com.tencent.wxcloudrun.model;

import java.util.Date;

public class GameRecord {

  private Long id;
  private String nickname;
  private Integer score;
  private Boolean cleared;
  private Integer levelReached;
  private Integer elapsedSeconds;
  private Date createdAt;

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

  public Date getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Date createdAt) {
    this.createdAt = createdAt;
  }
}
