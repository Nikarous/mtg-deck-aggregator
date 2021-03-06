import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = true

var store = {
  debug: true,
  state: {
    message: 'Hello!'
  },
  setMessageAction (newValue) {
    if (this.debug) console.log('setMessageAction triggered with', newValue)
    this.state.message = newValue
  },
  clearMessageAction () {
    if (this.debug) console.log('clearMessageAction triggered')
    this.state.message = ''
  }
}

new Vue({
  render: h => h(App),
}).$mount('#app')
