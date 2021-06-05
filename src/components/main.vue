<template>
  <div id="main">
    <el-container id="main-container">
      <el-aside style="width: 20%; height: 100%">
        <el-row class="tac" style="width: 100%">
          <el-col :span="12" style="width: 100%">
            <h5>1850668 李俊杰</h5>
            <el-menu
              default-active="pageallocation"
              class="el-menu-vertical-demo"
              :router="true"
            >
              <el-tag>内存管理项目</el-tag>
              <el-menu-item-group>
                <router-link to="pageallocation" tag="el-menu-item"
                  >调页管理</router-link
                >
                <router-link to="partitionmanagement" tag="el-menu-item"
                  >分区管理</router-link
                >
              </el-menu-item-group>
            </el-menu>
          </el-col>
        </el-row>
      </el-aside>

      <el-main style="width: 80%; height: 100%">
        <keep-alive>
          <router-view></router-view>
        </keep-alive>
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
#main,
#main-container {
  height: 100%;
  width: 100%;
}
</style>