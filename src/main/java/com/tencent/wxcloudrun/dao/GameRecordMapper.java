package com.tencent.wxcloudrun.dao;

import com.tencent.wxcloudrun.model.GameRecord;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface GameRecordMapper {

  int insert(GameRecord record);

  List<GameRecord> selectTop(@Param("limit") int limit);
}
