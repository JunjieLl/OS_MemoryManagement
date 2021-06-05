<template>
  <div style="width: 100%; height: 100%">
    <!--左侧面板-->
    <div style="width: 20%; height: 100%" class="panel">
      <div id="mymemory" class="memory" style="width: 100%; height: 100%">
        <div
          class="box-item"
          v-for="b in block"
          :key="b.begin"
          :style="[
            { height: (b.size / capacity) * 100 + '%' },
            { 'background-color': b.color },
          ]"
        >
          pid:{{ b.taskid }},size:{{ b.size }}KB,begin:{{ b.begin }}
        </div>
      </div>
    </div>
    <!--右侧面板-->
    <div style="width: 75%; height: 100%; margin: 10px" class="panel">
      <div>
        <el-card style="width: 40%" class="panel">
          <div slot="header" class="clearfix">
            <span>请求分配队列</span>
          </div>
          <el-table :data="request" stripe height="250">
            <el-table-column prop="taskid" label="进程号" width="100">
            </el-table-column>
            <el-table-column prop="requestDes" label="申请/释放" width="100">
            </el-table-column>
            <el-table-column prop="size" label="内存大小" width="100">
            </el-table-column>
          </el-table>
        </el-card>

        <el-card style="width: 45%" class="panel">
          <div slot="header" class="clearfix">
            <span>内存管理——动态分区算法</span>
          </div>
          <div>
            <el-select v-model="fisrtMatch" :disabled="canChoose">
              <el-option
                v-for="item in option"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </el-select>
          </div>
          <div style="height:10px"></div>
          <el-button type="primary" @click="run"> 下一步 </el-button>
          <el-button type="primary" @click="reSet"> 重置 </el-button>
        </el-card>
      </div>
      <div>
        <el-card style="width: 85%">
          <div slot="header" class="clearfix">
            <span>申请/释放记录</span>
          </div>
          <el-table :data="recordAllocate" stripe height="250">
            <el-table-column prop="recordNo" label="记录编号" width="100">
            </el-table-column>
            <el-table-column prop="taskid" label="进程号" width="100">
            </el-table-column>
            <el-table-column prop="requestKind" label="申请/释放" width="100">
            </el-table-column>
            <el-table-column prop="requestSize" label="内存大小" width="100">
            </el-table-column>
            <el-table-column prop="allocateArea" label="分配区域" width="100">
            </el-table-column>
            <el-table-column prop="releaseArea" label="释放区域" width="100">
            </el-table-column>
            <el-table-column prop="stasu" label="状态" width="100">
            </el-table-column>
          </el-table>
        </el-card>
      </div>
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
      //memory
      capacity: Number,
      block: [],
      //分配算法
      fisrtMatch: false,
      //分配、释放记录
      recordAllocate: [],
      recordNo: 1,
      //选择
      option: [
        {
          label: "最先适配算法",
          value: true,
        },
        {
          label: "最佳适配算法",
          value: false,
        },
      ],
      //作业队列
      request: [],
    };
  },
  computed: {
    canChoose: function () {
      return this.recordNo != 1;
    },
  },
  methods: {
    reSet: function () {
      this.init();
    },
    init: function () {
      this.request = [
        {
          taskid: 1,
          requestKind: 1, //申请
          requestDes: "申请",
          size: 130,
        },
        {
          taskid: 2,
          requestKind: 1,
          requestDes: "申请",
          size: 60,
        },
        {
          taskid: 3,
          requestKind: 1,
          requestDes: "申请",
          size: 100,
        },
        {
          taskid: 2,
          requestKind: 0,
          requestDes: "释放",
          size: 60,
        },
        {
          taskid: 4,
          requestKind: 1,
          requestDes: "申请",
          size: 200,
        },
        {
          taskid: 3,
          requestKind: 0,
          requestDes: "释放",
          size: 100,
        },
        {
          taskid: 1,
          requestKind: 0,
          requestDes: "释放",
          size: 130,
        },
        {
          taskid: 5,
          requestKind: 1,
          requestDes: "申请",
          size: 140,
        },
        {
          taskid: 6,
          requestKind: 1,
          requestDes: "申请",
          size: 60,
        },
        {
          taskid: 7,
          requestKind: 1,
          requestDes: "申请",
          size: 50,
        },
        {
          taskid: 6,
          requestKind: 0,
          requestDes: "释放",
          size: 60,
        },
      ];
      this.block = [];
      this.recordNo = 1;
      this.recordAllocate = [];

      this.capacity = 640; //绑定后不需要调整了
      this.block.push({
        begin: 1,
        size: this.capacity,
        busy: false,
        taskid: "空闲", //在busy有效时才有
        color: this.randomColor(false),
      });
    },
    run: function () {
      if (this.request.length == 0) {
        alert("执行完毕");
        return; //结束
      }

      var a = this.request[0]; //弹出请求
      if (a.requestKind == 0) {
        this.releaseMemory(a.taskid);
        this.request.shift();
      } else {
        if (this.fisrtMatch == true) {
          if (this.allocateBlockwithFisrtMatch(a.size, a.taskid) == -1) {
            alert("无连续分区可分配");
          } else {
            this.request.shift();
          }
        } else {
          if (this.allocateBlockwithBestMatch(a.size, a.taskid) == -1) {
            alert("无连续分区可分配");
          } else {
            this.request.shift();
          }
        }
      }
      this.recordNo++;
    },
    allocateBlockwithBestMatch: function (blockSize, taskid) {
      var best_i = -1;
      var not_choose = true;
      for (var i = 0; i < this.block.length; i++) {
        if (this.block[i].busy == false) {
          if (this.block[i].size >= blockSize) {
            //候选块
            if (not_choose == true) {
              best_i = i;
              not_choose = false;
            } else if (
              this.block[i].size - blockSize <
              this.block[best_i].size - blockSize
            ) {
              best_i = i;
            }
          }
        }
      }
      if (not_choose == true) {
        //没有可分配的块
        this.recordAllocate.push({
          recordNo: this.recordNo,
          taskid: taskid,
          requestKind: "申请",
          requestSize: blockSize,
          allocateArea: "-",
          releaseArea: "-",
          stasu: "失败",
        });
        return -1;
      }

      var isfull = this.block[best_i].size == blockSize;
      var pre = this.block[best_i];
      var allocate = {
        begin: pre.begin,
        size: blockSize,
        busy: true,
        taskid: taskid,
        color: this.randomColor(true),
      };
      pre.begin = pre.begin + blockSize;
      pre.size = pre.size - blockSize;
      if (isfull == true) {
        this.block.splice(best_i, 1, allocate);
      } else {
        this.block.splice(best_i, 1, allocate, pre);
      }

      //记录
      var end = allocate.begin + blockSize - 1;
      this.recordAllocate.push({
        recordNo: this.recordNo,
        taskid: taskid,
        requestKind: "申请",
        requestSize: blockSize,
        allocateArea: "[" + allocate.begin + "," + end + "]",
        releaseArea: "-",
        stasu: "成功",
      });
      return 1;
    },
    allocateBlockwithFisrtMatch: function (blockSize, taskid) {
      //首次适应算法
      var pre;
      var allocate;
      var end;
      for (var i = 0; i < this.block.length; i++) {
        if (this.block[i].busy == false) {
          if (this.block[i].size > blockSize) {
            //可以分配，且大于空间
            pre = this.block[i];
            allocate = {
              begin: pre.begin,
              size: blockSize,
              busy: true,
              taskid: taskid,
              color: this.randomColor(true),
            };
            pre.begin = pre.begin + blockSize;
            pre.size = pre.size - blockSize;
            this.block.splice(i, 1, allocate, pre);
            //记录
            end = allocate.begin + blockSize - 1;
            this.recordAllocate.push({
              recordNo: this.recordNo,
              taskid: taskid,
              requestKind: "申请",
              requestSize: blockSize,
              allocateArea: "[" + allocate.begin + "," + end + "]",
              releaseArea: "-",
              stasu: "成功",
            });
            return 1; //分配成功
          } else if (this.block[i].size == blockSize) {
            //正好匹配
            pre = this.block[i];
            allocate = {
              begin: pre.begin,
              size: blockSize,
              busy: true,
              taskid: taskid,
              color: this.randomColor(true),
            };
            this.block.splice(i, 1, allocate);
            end = allocate.begin + blockSize - 1;
            this.recordAllocate.push({
              recordNo: this.recordNo,
              taskid: taskid,
              requestKind: "申请",
              requestSize: blockSize,
              allocateArea: "[" + allocate.begin + "," + end + "]",
              releaseArea: "-",
              stasu: "成功",
            });
            return 1; //分配成功
          }
        }
      }
      this.recordAllocate.push({
        recordNo: this.recordNo,
        taskid: taskid,
        requestKind: "申请",
        requestSize: blockSize,
        allocateArea: "-",
        releaseArea: "-",
        stasu: "失败",
      });
      return -1; //分配失败
    },
    releaseMemory: function (taskid) {
      var a;
      var before = false;
      var after = false;
      var del_i = -1;
      var delSize;
      for (var i = 0; i < this.block.length; i++) {
        if (this.block[i].busy == true && this.block[i].taskid == taskid) {
          del_i = i;
          //回收
          a = this.block[i];
          delSize = a.size;
          a.color = this.randomColor(false);
          a.taskid = "空闲";
          a.busy = false;
          if (i > 0 && this.block[i - 1].busy == false) {
            //可以合并
            a.begin = this.block[i - 1].begin;
            a.size = this.block[i - 1].size + a.size;
            before = true;
          }
          if (i < this.block.length - 1 && this.block[i + 1].busy == false) {
            a.size = this.block[i + 1].size + a.size;
            after = true;
          }
          break; //note
        }
      }
      if (del_i == -1) {
        this.recordAllocate.push({
          recordNo: this.recordNo,
          taskid: taskid,
          requestKind: "释放",
          requestSize: delSize,
          allocateArea: "-",
          releaseArea: "-",
          stasu: "没有找到进程所在内存块",
        });
        return;
        //没有找到
      }
      if (after == true && before == true) {
        this.block.splice(del_i - 1, 3, a);
      } else if (after == true && before == false) {
        this.block.splice(del_i, 2, a);
      } else if (after == false && before == true) {
        this.block.splice(del_i - 1, 2, a);
      } else {
        this.block.splice(del_i, 1, a);
      }
      var end = a.begin + a.size - 1;
      this.recordAllocate.push({
        recordNo: this.recordNo,
        taskid: taskid,
        requestKind: "释放",
        requestSize: delSize,
        allocateArea: "-",
        releaseArea: "[" + a.begin + "," + end + "]",
        stasu: "成功",
      });
    },
    randomColor: function (busy) {
      if (busy == false) {
        return "rgb(255,255,255)";
      }
      var r = Math.floor(Math.random() * 256 - 100 + 1) + 100;
      var g = Math.floor(Math.random() * 256 - 100 + 1) + 100;
      var b = Math.floor(Math.random() * 256 - 100 + 1) + 100;
      return "rgb(" + r + "," + g + "," + b + ")";
    },
  },
};
</script>

<style scoped>
.memory {
  display: flex;
  flex-direction: column-reverse;
  border-style: solid;
  border-width: 0.5px;
}
.box-item {
  border-style: solid;
  border-width: 0.25px;
}

.panel {
  float: left;
}
</style>