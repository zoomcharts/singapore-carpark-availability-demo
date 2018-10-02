import $ from 'jquery'
import Clusterize from 'clusterize.js'
import Template from './template'

let temp = new Template()
let geoChart
let clusterize

export default {
  init (param) {
    // set events to list items
    this.setEventsToListEle(param)
    this.setHeaderData(param.data)
    this.renderList(param.data)
  },
  updateGeoChart (callback) {
    geoChart.updateSettings({
      filters: {
        nodeFilter: callback
      },
      layers: [{
        id: 'piePositions'
      }]
    })
  },
  setEventsToListEle (param) {
    let _that = this
    geoChart = param.chart

    $(document).on({
      click () {
        let listItemId = $(this).attr('id').split('-')[0]
        let selectedNode

        if (!$(this).hasClass('active')) {
          // remove active class for each list item
          $('#carpark-list .item').removeClass('active')
          $('#filter-btn-1[type="radio"]').prop('checked', false)

          // add active class to active list item
          $(this).addClass('active')

          // update chart settings
          _that.updateGeoChart((node) => {
            if (node.car_park_no == listItemId) {
              selectedNode = node
              return true
            }
          })

          // go to node coord
          setTimeout(() => {
            geoChart.updateStyle()
            var map = geoChart.leaflet()
            if (map && selectedNode) {
              selectedNode.coordinates[0] > 100 && selectedNode.coordinates.reverse()
              map.panTo(selectedNode.coordinates)
            }
          }, 200)
        }
      }
    }, `#carpark-list .item`)

    $(document).on({
      keyup () {
        var input; var filter; var idStore = []
        input = $(this)
        filter = input.val().toUpperCase()

        if (filter.length >= 2) {
          // filter list
          let filterList = temp.menulist(param.data)
          for (var i = 0, ii = filterList.length; i < ii; i++) {
            var suitable = false
            for (const key in filterList[i].values.title) {
              if (filterList[i].values.title.hasOwnProperty(key)) {
                const element = filterList[i].values.title[key]
                if (element.toString().toUpperCase().indexOf(filter) > -1) {
                  suitable = true
                  idStore.push(filterList[i].values.id.toUpperCase())
                  $('#filter-btn-1[type="radio"]').prop('checked', false)
                }
              }
            }
            filterList[i].active = suitable
          }

          // update chart settings
          _that.updateGeoChart((node) => {
            let nodeId = node.id.toUpperCase()
            if (idStore.indexOf(nodeId) > -1) {
              return true
            }
          })

          // update list
          clusterize.update(_that.filterRows(filterList))
        }

        // if search string is less than
        if (filter.length < 2) {
          $(document).find('#filter-btn-1').click()
        }
      }
    }, `.filter-wrapper input[name=search]`)

    $(document).on({
      change () {
        let filterList = temp.menulist(param.data)
        let filter = $(this).val()
        let storeId = []

        // filter list
        for (var i = 0, ii = filterList.length; i < ii; i++) {
          let id = filterList[i].values.id
          let carParkType = parseInt(filterList[i].values.infoList.carParkType)
          let suitable = false
          if (carParkType == filter) {
            suitable = true
            storeId.push(id)
          }
          filterList[i].active = suitable
        }

        // uncheck Show All btn
        $('#filter-btn-1[type="radio"]').prop('checked', false)

        // update list
        clusterize.update(_that.filterRows(filterList))

        // update chart settings
        _that.updateGeoChart((node) => {
          let id = node.id.toUpperCase()
          if (storeId.indexOf(id) > -1) {
            return true
          }
        })
      }
    }, `.dropdown-wrapper.car-park-type`)

    $(document).on({
      change () {
        let filterList = temp.menulist(param.data)
        let filter = $(this).val()
        let storeId = []

        // filter list
        for (var i = 0, ii = filterList.length; i < ii; i++) {
          let id = filterList[i].values.id
          let nightParking = parseInt(filterList[i].values.infoList.nightParking)
          let suitable = false
          if (nightParking == filter) {
            suitable = true
            storeId.push(id)
          }
          filterList[i].active = suitable
        }

        // uncheck Show All btn
        $('#filter-btn-1[type="radio"]').prop('checked', false)

        // update list
        clusterize.update(_that.filterRows(filterList))

        // update chart settings
        _that.updateGeoChart((node) => {
          let id = node.id.toUpperCase()
          if (storeId.indexOf(id) > -1) {
            return true
          }
        })
      }
    }, `.dropdown-wrapper.night-parking`)

    $(document).on({
      change () {
        let filterList = temp.menulist(param.data)
        let filter = $(this).val()
        let storeId = []

        // filter list
        for (var i = 0, ii = filterList.length; i < ii; i++) {
          let id = filterList[i].values.id
          let dataLotType = parseInt(filterList[i].values.infoList.dataLotType)
          let suitable = false
          if (dataLotType == filter) {
            suitable = true
            storeId.push(id)
          }
          filterList[i].active = suitable
        }

        // uncheck Show All btn
        $('#filter-btn-1[type="radio"]').prop('checked', false)

        // update list
        clusterize.update(_that.filterRows(filterList))

        // update chart settings
        _that.updateGeoChart((node) => {
          let id = node.id.toUpperCase()
          if (storeId.indexOf(id) > -1) {
            return true
          }
        })
      }
    }, `.dropdown-wrapper.lot-type`)

    $(document).on({
      change () {
        if ($('#filter-btn-1').is(':checked')) {
          // update chart settings
          _that.updateGeoChart((node) => {
            return true
          })

          setTimeout(function () {
            $('#carpark-list').find(`li.item`).removeClass('active')

            // update list
            let listData = temp.menulist(param.data)
            clusterize.update(_that.filterRows(listData))

            $('.filter-wrapper input[name=search]').val('')
          }, 10)
        }
      }
    }, `#filter-btn-1`)

    $(document).on({
      change () {
        if ($('#filter-btn-2').is(':checked')) {
          // filter list
          let filterList = temp.menulist(param.data)
          for (var i = 0, ii = filterList.length; i < ii; i++) {
            var suitable = false
            if (parseInt(filterList[i].values.graph.free) > 0) {
              suitable = true
            }
            filterList[i].active = suitable
          }

          // update list
          clusterize.update(_that.filterRows(filterList))

          // update chart settings
          _that.updateGeoChart((node) => {
            if (node.carpark_info[0].lots_available > 0) {
              return true
            }
          })
        }
      }
    }, `#filter-btn-2`)

    $(document).on({
      change () {
        if ($('#filter-btn-3').is(':checked')) {
          let storeId = []

          // filter list
          let filterList = temp.menulist(param.data)
          for (var i = 0, ii = filterList.length; i < ii; i++) {
            let id = filterList[i].values.id
            let free = parseInt(filterList[i].values.graph.free)
            let taken = parseInt(filterList[i].values.graph.taken)
            let total = free + taken
            let freePorcentage = Math.round(parseInt(free) * 100 / total)
            let suitable = false

            if (freePorcentage >= 50) {
              suitable = true
              storeId.push(id)
            }
            filterList[i].active = suitable
          }

          // update list
          clusterize.update(_that.filterRows(filterList))

          // update chart settings
          _that.updateGeoChart((node) => {
            let id = node.id.toUpperCase()
            if (storeId.indexOf(id) > -1) {
              return true
            }
          })
        }
      }
    }, `#filter-btn-3`)

    $(document).on({
      click () {
        $('#filter-btn').toggleClass('active')
        if ($('#filter-btn').hasClass('active')) {
          $('.filter-wrapper').addClass('active')
        } else {
          $('.filter-wrapper').removeClass('active')
        }
      }
    }, `#filter-btn`)

    $(document).on({
      click (e) {
        e.stopPropagation()
        if ($(this).parents('.item').hasClass('active')) {
          $(document).find('#filter-btn-1').click()
        }
      }
    }, `#close-list-item`)
  },
  setHeaderData (data) {
    temp.menuListHeader(data)
  },
  renderList (data) {
    // get list template
    let listData = temp.menulist(data)

    // create list
    clusterize = new Clusterize({
      rows: this.filterRows(listData),
      scrollId: 'section-bottom',
      contentId: 'carpark-list'
    })
  },
  filterRows (rows) {
    var results = []
    for (var i = 0, ii = rows.length; i < ii; i++) {
      if (rows[i].active) results.push(rows[i].markup)
    }
    return results
  }
}
