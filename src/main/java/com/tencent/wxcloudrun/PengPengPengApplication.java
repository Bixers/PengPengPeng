package com.tencent.wxcloudrun;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.tencent.wxcloudrun.dao")
public class PengPengPengApplication {

  public static void main(String[] args) {
    SpringApplication.run(PengPengPengApplication.class, args);
  }
}
