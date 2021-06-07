<template>
  <div clsss="container">
    <!--工作台-->
    <div class="left-panel">
      <div slot="header" class="clearfix">
        <span>内存管理——按需调页算法</span>
      </div>
      <!--指令执行序列-->
      <el-card class="card">
        <div slot="header" class="clearfix">
          <span>指令执行序列</span>
        </div>
        <el-table :data="executeQueue" stripe style="width: 100%" height="250">
          <el-table-column
            prop="insNo"
            label="指令编号"
            width="100"
          ></el-table-column>
          <el-table-column
            prop="position"
            label="指令地址"
            width="100"
          ></el-table-column>
          <el-table-column prop="pageNo" label="所在页号"> </el-table-column>
        </el-table>
      </el-card>

      <!--内存块-->
      <el-card class="card">
        <div slot="header" class="clearfix">
          <span>分配内存块</span>
        </div>
        <el-table :data="block" stripe style="width: 100%" height="250">
          <el-table-column prop="no" label="块号" width="100"></el-table-column>
          <el-table-column
            prop="pageNo"
            label="页号"
            width="100"
          ></el-table-column>
          <el-table-column prop="valid" label="有效位"> </el-table-column>
          <el-table-column prop="timeZone" label="时间域"> </el-table-column>
        </el-table>
      </el-card>
      <!--页面置换记录-->
      <el-card class="card">
        <div slot="header" class="clearfix">
          <span>页面置换记录</span>
        </div>
        <el-table
          :data="this.replaceRecord"
          stripe
          style="width: 100%"
          height="250"
        >
          <el-table-column
            prop="insNo"
            label="指令编号"
            width="100"
          ></el-table-column>
          <el-table-column
            prop="position"
            label="指令地址"
            width="100"
          ></el-table-column>
          <el-table-column prop="pageNo" label="所在页号"> </el-table-column>
          <el-table-column prop="inBlock" label="所在块号"> </el-table-column>
          <el-table-column prop="isSwapIn" label="是否调入"></el-table-column>
          <el-table-column prop="isReplace" label="是否替换"></el-table-column>
          <el-table-column prop="replaceBlock" label="替换块"></el-table-column>
          <el-table-column prop="prePage" label="替换页号"> </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!--控制台-->
    <div>
      <el-card>
        <el-card>
          <el-select v-model="isLru" :disabled="canChoose">
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
          <el-slider
            v-model="instructionNumber"
            :min="10"
            :max="500"
            :step="1"
            :disabled="canChoose"
          >
          </el-slider>
          <el-tag>指令数:{{ instructionNumber }}条</el-tag>
          <el-slider
            v-model="blockNum"
            :min="1"
            :max="20"
            :step="1"
            :disabled="canChoose"
          >
          </el-slider>
          <el-tag>分配内存块数:{{ blockNum }}块</el-tag>
          <el-button type="primary" @click="init">设置/重置</el-button>
        </el-card>

        <el-card>
          <el-progress type="circle" :percentage="lackPage"></el-progress>
          <el-tag>缺页率</el-tag>
        </el-card>

        <el-card>
          <el-slider
            v-model="time"
            :min="200"
            :max="1000"
            :step="50"
            :disabled="isRun"
          >
          </el-slider>
          <el-tag>执行一条指令的间隔为{{ time }}ms</el-tag>
          <el-slider
            v-model="runCount"
            :min="0"
            :max="instructionNumber - currentInstruction + 1"
            :step="1"
            :disabled="isRun"
          >
          </el-slider>

          <el-button
            type="primary"
            :loading="isRun"
            :disabled="currentInstruction > instructionNumber"
            @click="execute"
            >执行{{ runCount }}步</el-button
          >
        </el-card>

        <el-card>
          <el-button
            type="primary"
            :loading="isRun"
            :disabled="currentInstruction > instructionNumber"
            @click="executeOnce"
            >执行一步</el-button
          >
          <el-button
            type="primary"
            :disabled="currentInstruction > instructionNumber"
            @click="stopExecute"
            >停止执行</el-button
          >
        </el-card>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  created() {
    this.init();
  },
  data() {
    return {
      //指令执行
      currentInstruction: 1,
      startPosition: Number,
      instructionNumber: 320,
      executeQueue: [],
      //页面
      block: [],
      blockNum: 4,
      //是否是LRU算法，用于显示LRU执行过程
      isLru: true,
      //替换记录
      replaceRecord: [],
      //选择两种算法
      options: [
        {
          label: "LRU替换算法",
          value: true,
        },
        {
          label: "FIFO替换算法",
          value: false,
        },
      ],
      //是否正在被运行
      isRun: false,
      //缺页计数
      lackPageCount: 0,
      //执行次数计数
      runCount: 1,
      time: 500, //ms
      interval: -1,
    };
  },
  computed: {
    lackPage: function () {
      if (this.currentInstruction == 1) {
        return 0;
      }
      return (this.lackPageCount / (this.currentInstruction - 1)) * 100;
    },
    canChoose: function () {
      if (this.currentInstruction > 1) {
        return true;
      }
      return false;
    },
  },
  methods: {
    init: function () {
      //停止之前的执行
      this.stopExecute();
      //置空相关队列
      this.executeQueue = [];
      this.replaceRecord = [];
      this.block = [];
      this.isRun = false;
      this.currentInstruction = 1; //从头开始
      this.lackPageCount = 0;
      this.time = 500;
      this.interval = -1;
      this.startPosition =
        Math.floor(Math.random() * this.instructionNumber) + 1; //起始指令地址

      this.executeQueue.push({
        insNo: 1,
        position: this.startPosition,
        pageNo: Math.ceil(this.startPosition / 10),
      });
      //指令序列生成
      var insNo = 0;
      var position = 0;
      var pageNo = 0;
      for (var i = 1; i < this.instructionNumber; i++) {
        insNo = i + 1;
        if (Math.random() <= 0.25) {
          //执行前面的
          position =
            Math.floor(
              Math.random() * (this.executeQueue[i - 1].position - 1)
            ) + 1;
          pageNo = Math.ceil(position / 10);
        } else if (Math.random() >= 0.75) {
          //执行后面的
          position =
            Math.floor(
              Math.random() *
                (this.instructionNumber - this.executeQueue[i - 1].position)
            ) +
            this.executeQueue[i - 1].position +
            1;
          pageNo = Math.ceil(position / 10);
        } else {
          //顺序
          position = this.executeQueue[i - 1].position + 1;
          if (position > this.instructionNumber) {
            position = Math.floor(Math.random() * this.instructionNumber) + 1;
          }
          pageNo = Math.ceil(position / 10);
        }
        //console.log(position);
        this.executeQueue.push({
          insNo: insNo,
          position: position,
          pageNo: pageNo,
        });
      }
      //内存块初始化
      for (i = 0; i < this.blockNum; i++) {
        this.block.push({
          no: i + 1,
          pageNo: "-",
          valid: "invalid",
          timeZone: 0, //用于实现LRU或FCFS
        });
      }
    },
    executeOnce: function () {
      this.executeInstruction();
      this.isRun = false;
    },
    execute: function () {
      this.interval = setTimeout(() => {
        if (this.interval) {
          clearInterval(this.interval);
        }
        if (this.runCount < 1 || this.executeInstruction() == -1) {
          this.isRun = false;
          return;
        }
        this.runCount--;
        this.interval = setTimeout(this.execute, this.time);
      }, this.time);
    },
    stopExecute: function () {
      this.isRun = false;
      clearInterval(this.interval);
    },
    executeInstruction: function () {
      this.isRun = true;
      if (this.currentInstruction > this.instructionNumber) {
        alert("指令执行完毕");
        this.isRun = false;
        return -1; //执行完毕
      }
      //获取指令相应数据
      var pageNo = this.executeQueue[0].pageNo;
      var insNo = this.executeQueue[0].insNo;
      var position = this.executeQueue[0].position;
      //查看是否有剩余界面
      var freeBlock = this.isFreeBlock(pageNo);
      //存在空闲块
      if (freeBlock > -1) {
        this.lackPageCount++;

        this.block[freeBlock].pageNo = pageNo;
        this.block[freeBlock].valid = "valid";
        //LRU与FIFO算法是一致的
        this.block[freeBlock].timeZone = this.currentInstruction;

        this.replaceRecord.unshift({
          insNo: insNo,
          position: position,
          pageNo: pageNo,
          isSwapIn: "yes",
          isReplace: "no",
          replaceBlock: "-",
          prePage: "-",
          inBlock: freeBlock + 1,
        });
      } else if (freeBlock == -(this.instructionNumber + 1)) {
        //不存在空闲块且需要替换
        this.lackPageCount++;

        var replaceBlock = this.chooseBlockToReplace();
        var prePage = this.block[replaceBlock].pageNo;
        this.block[replaceBlock].pageNo = pageNo;
        this.block[replaceBlock].valid = "valid";
        //LRU与FIFO算法是一致的
        this.block[replaceBlock].timeZone = this.currentInstruction;

        this.replaceRecord.unshift({
          insNo: insNo,
          position: position,
          pageNo: pageNo,
          isSwapIn: "yes",
          isReplace: "yes",
          replaceBlock: replaceBlock + 1,
          prePage: prePage,
          inBlock: replaceBlock + 1,
        });
      } else {
        //已经存在不需要替换
        freeBlock = -freeBlock - 1; //已经存在的页面
        // this.block[freeBlock].pageNo=pageNo;
        // this.block[freeBlock].valid="valid";不需要修改

        //LRU与FIFO算法的区别
        if (this.isLru == true) {
          this.block[freeBlock].timeZone = this.currentInstruction;
        }

        this.replaceRecord.unshift({
          insNo: insNo,
          position: position,
          pageNo: pageNo,
          isSwapIn: "no",
          isReplace: "no",
          replaceBlock: "-",
          prePage: "-",
          inBlock: freeBlock + 1,
        });
      }
      //把该指令从指令队列中移除
      this.executeQueue.shift(); //删除首元素
      //执行下一条指令
      this.currentInstruction++;
      return 0;
    },
    chooseBlockToReplace: function () {
      var replaceBlock = 0;
      //置换算法
      for (var i = 0; i < this.block.length; i++) {
        if (this.block[i].timeZone < this.block[replaceBlock].timeZone) {
          replaceBlock = i;
        }
      }
      return replaceBlock;
    },
    isFreeBlock: function (pageNo) {
      for (var i = 0; i < this.block.length; i++) {
        if (this.block[i].valid == "invalid") {
          return i;
        } else if (this.block[i].pageNo == pageNo) {
          return -(i + 1); //最大-n
        }
      } //不存在
      return -(this.instructionNumber + 1);
    },
  },
};
</script>

<style scoped>
.container {
  height: 100%;
  width: 100%;
}
.card {
  float: left;
  margin: 0px, 0px;
}
</style>