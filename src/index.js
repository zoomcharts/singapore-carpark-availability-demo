import $ from 'jquery'
import { GeoChart } from '@dvsl/zoomcharts'
import sidebar from './sidebar'
import { loadChartData } from './loadData'
import { chartSettings } from './chart'
import introJs from './introjs'
import 'bootstrap'
import 'pretty-dropdowns'
import 'bootstrap-slider'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'pretty-dropdowns/dist/css/prettydropdowns.css'
import './../src/style/style.css'
import './../src/style/introjs.css'
import './../src/style/bootstrap-slider.css'

let carParkAvailabilityUrl = 'https://api.data.gov.sg/v1/transport/carpark-availability'
let urls = []
let geoChart

//
let objectArr = {
  init: {
    setUp () {
      window.enableAggregation = true
    },
    activate () {
      let elArr = ['.menu-btn']
      elArr.length && elArr.forEach(e => {
        $(`${e}`).removeClass('disabled')
      })
    },
    show () {
      let elArr = []
      elArr.length && elArr.forEach(e => {
        $(`${e}`).show()
      })
    },
    slider () {
      let mySlider = $('#slider input.slider').slider()
      mySlider.on('slide', (slideEvt) => {
        // show aggregation level
        $('#aggrStatusLevel').text(slideEvt.value)

        // update aggregation distance
        geoChart.updateSettings({
          layers: [{
            id: 'piePositions',
            aggregation: {
              distance: slideEvt.value
            }
          }]
        })
      })
    },
    setCookie (cname, cvalue, exdays) {
      var d = new Date()
      d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))
      var expires = 'expires=' + d.toGMTString()
      document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
    },
    getCookie (cname) {
      var name = cname + '='
      var decodedCookie = decodeURIComponent(document.cookie)
      var ca = decodedCookie.split(';')
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i]
        while (c.charAt(0) == ' ') {
          c = c.substring(1)
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length)
        }
      }
      return ''
    },
    checkCookie () {
      var tour = objectArr.init.getCookie('tour')
      if (tour != '') {

      } else {
        tour = 'Singapore POC tour'
        if (tour != '' && tour != null) {
          $('.trigger-btn').click()
          objectArr.init.setCookie('tour', tour, 30)
        }
      }
    },
    setSelectPicker () {
      // To style all selects
      $(document).ready(function () {
        $('select').prettyDropdown()
      })
    },
    setWebsiteGuide () {
      let guideArr = {
        modal: `In this map created by ZoomCharts you can see all car parks in Singapore 
                    along with information about how many spaces are left in each car park. 
                    This tour will guide you through the features of the map.`,
        intro: [{
          selector: '#menu-btn',
          text: `Main menu: here you will find all the controls and filtering options.`,
          step: 1
        },
        {
          selector: '#carpark-list .item:eq(0)',
          text: `Choose your parking lot.`,
          step: 2
        }, {
          selector: '#radio-btn-wrapper ul > li:eq(0)',
          text: `Press on 'All' to see all parking lots.`,
          step: 3
        }, {
          selector: '#radio-btn-wrapper ul > li:eq(1)',
          text: `Select only parking lots with free spaces.`,
          step: 4
        }, {
          selector: '#radio-btn-wrapper ul > li:eq(2)',
          text: `Select only parking lots with at least half of the spaces free.`,
          step: 5
        }, {
          selector: '.filter-wrapper .input-wrapper:eq(1)',
          text: `Search for a particular parking lot by address or name.`,
          step: 6
        }, {
          selector: '.filter-wrapper .input-wrapper:eq(2)',
          text: `Select car park type (e.g., surface car park).`,
          step: 7
        }, {
          selector: '.filter-wrapper .input-wrapper:eq(3)',
          text: `Select parking lot type (e.g., C).`,
          step: 8
        }, {
          selector: '.filter-wrapper .input-wrapper:eq(4)',
          text: `Select night parking (Yes/No).`,
          step: 9
        }, {
          selector: '#slider',
          text: `Adjust aggregation level.`,
          step: 10
        }],
        render () {
          // set up modal text
          $('#basicModal .modal-body').text(this.modal)

          // set up guide steps
          this.intro.forEach(e => {
            var attr = $(e.selector).attr('data-intro')
            if (typeof attr === 'undefined') {
              $(e.selector).attr({
                'data-intro': e.text,
                'data-step': e.step
              })
            }
          })
        }
      }
      guideArr.render()
    }
  },
  bind: {
    click: {
      'menu-btn': () => {
        $('#mySidenav').toggleClass('active')
        if ($('#mySidenav').hasClass('active')) {
          $('#mySidenav').css({ width: 'var(--side-bar-width)' })
          $('#chart-menu-wrapper').addClass('active')

          // remove car parking lots info pop up
          $('.data-wrapper').remove()
        } else {
          $('#mySidenav').css({ width: 0 })
          $('#chart-menu-wrapper').removeClass('active')
        }
      },
      'close-popup-btn': () => {
        // remove car parking lots info pop up
        $('.data-wrapper').remove()
      },
      'startTour': () => {
        $('#closeTour, #menu-btn, #filter-btn').click()

        setTimeout(() => {
          introJs().start()
        }, 700)
      }
    }
  }

}

let fetchDataByApi = () => {
  fetch(carParkAvailabilityUrl)
    .then(response => response.json())
    .then(res => {
      if (res.items) {
        let limit = res.items[0].carpark_data.length

        urls = [
          carParkAvailabilityUrl,
          `https://data.gov.sg/api/action/datastore_search?resource_id=139a3035-e624-4f56-b63f-89ae28d4ae4c&limit=${limit}`
        ]

        // load data
        loadChartData(urls).then(data => {
          // set full geochart setting after data load
          let fullSettings = chartSettings(data)
          geoChart.updateSettings(fullSettings)
          initCarParkList(data)
          initProject()
          $('.loading-wrapper').hide()

          // update data
          let updateData = setInterval(function () {
            fetchDataByApi()
            clearInterval(updateData)
          }, 10 * 60 * 1000) // 10 min
        })
      } else {
        console.log('The server encountered an unexpected condition which prevented it from fulfilling the request.')
      }
    })
}

let initCarParkList = (data) => {
  // init carpark list component
  sidebar.init({
    data: data,
    chart: geoChart
  })
}

let initChart = () => {
  // init geoChart
  geoChart = new GeoChart({
    container: document.getElementById('demo'),
    navigation: {
      initialLat: 1.358743,
      initialLng: 103.806350,
      initialZoom: 12,
      minZoom: 0,
      maxZoom: 18
    },
    data: {},
    assetsUrlBase: './dist/assets/'
  })
}

let initProject = () => {
  // object init..
  for (const key in objectArr) {
    if (objectArr.hasOwnProperty(key)) {
      // bind events
      if (key == 'bind') {
        // check events arr
        const eventArr = objectArr[key]
        for (const event in eventArr) {
          if (eventArr.hasOwnProperty(event)) {
            // check element arr
            const elArr = eventArr[event]
            for (const selector in elArr) {
              if (elArr.hasOwnProperty(selector)) {
                // bind event & fn
                const fn = elArr[selector]
                $(document).off(event, `#${selector}`, fn)
                $(document).on(event, `#${selector}`, fn)
              }
            }
          }
        }
      }

      // init elements
      if (key == 'init') {
        //
        const iObj = objectArr[key]
        for (const i in iObj) {
          if (iObj.hasOwnProperty(i)) {
            //
            const init = iObj[i]
            init()
          }
        }
      }
    }
  }
}

window.onload = () => {
  initChart()
  fetchDataByApi()
}
