import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../components/main.vue'

Vue.use(VueRouter)

const routes = [{
    path: '/',
    name: 'Home',
    component: Home,
    children: [{
        path: 'pageallocation',
        name: "pageallocation",
        component: () =>
            import ('../components/rammanagement.vue')
    }, {
        path: 'partitionmanagement',
        name: "partitionmanagement",
        component: () =>
            import ('../components/PartitionManagement.vue')
    }]
}, ]

const router = new VueRouter({
    routes,
    mode: 'history'
})

export default router