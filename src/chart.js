import $ from 'jquery'
import Template from './template'

export let chartSettings = (opt) => {
  var hasProp = {}.hasOwnProperty
  var temp = new Template()
  var SLICES_COLOR = ['#51da2e', 'rgba(0,0,0,0)']
  var STATUS_COLOR_ARR = {
    full: 'rgba(220,0,0,0.8)',
    halfFull: 'rgba(40,40,40,0.8)',
    empty: 'rgba(40,140,40,0.9)'
  }
  let geoChart
  let zoomLevel = null
  let nodePositionArr = {}

  let updateCarParkData = (event, args) => {
    //
    geoChart = args.chart

    // remove car parking lots info pop up
    $('.data-wrapper').remove()
  }

  let showCarParkData = (event, args) => {
    let cParkData = null
    let nodes = args.clickNode || null
    let clickPie = args.clickPie || null
    let clickItem = event.clickItem || null

    if ((clickItem && clickItem.currentBounds) || clickPie) {
      if (clickPie) {
        // if click on piechart
        cParkData = clickPie.data.values[0].parentNode
      } else if (nodes.data.aggregatedNodes) {
        // if click on geochart node
        cParkData = nodes.data
      }

      // if click on aggregation node
      if (!cParkData.aggregatedNodes || cParkData.aggregatedNodes.length > 1) {
        //
        let map = geoChart.leaflet()

        // zoom to aggregateNode area
        if (cParkData.aggregatedNodes.length && cParkData.aggregatedNodes.length > 1) {
          zoomLevel = geoChart.zoomLevel(); zoomLevel++
          if (map) {
            cParkData.coordinates[0] > 100 && cParkData.coordinates.reverse()
            map.panTo(cParkData.coordinates)
            setTimeout(() => {
              geoChart.zoomLevel(zoomLevel)
              geoChart.updateStyle()
            }, 200)
          }
        }
        return
      };

      // create and show popup
      let id = nodes.id.split('aggr_')[1]
      if (nodePositionArr[id]) {
        temp.carparkPopup(nodePositionArr[id])
      }
    } else {
      $('.data-wrapper').remove()
    }
  }

  let setNodeColor = (node) => {
    // change node color based on lots_available value
    let cPInfo; let freePorcentage = 0; let free = 0; let taken = 0

    // for aggregation background color
    freePorcentage = getAvailableParkingLots(node.data.aggregatedNodes).procentage

    // for parking lots background color
    if (Array.isArray(node)) {
      cPInfo = node[0].data ? node[0].data.carpark_info[0] : node[0].carpark_info[0]
      free = cPInfo.lots_available
      taken = cPInfo.total_lots - free
      freePorcentage = parseInt(Math.round(cPInfo.lots_available * 100 / cPInfo.total_lots))
    }

    if (freePorcentage >= 0 && freePorcentage <= 30) {
      return STATUS_COLOR_ARR.full
    } else if (freePorcentage > 30 && freePorcentage <= 70) {
      return STATUS_COLOR_ARR.halfFull
    } else {
      return STATUS_COLOR_ARR.empty
    }
  }

  let setNodeItem = (node, r, text) => {
    // set node color
    node.fillColor = setNodeColor(node)

    if (r < 15) {
      // set label prop
      node.label = text
      node.labelStyle.backgroundStyle.fillColor = setNodeColor(node)
      node.labelStyle.backgroundStyle.lineColor = setNodeColor(node)
      node.labelStyle.textStyle.fillColor = '#ccc'
    } else {
      let aggrNode = node.data.aggregatedNodes
      let carParkArr = [
        'SURFACE CAR PARK',
        'MULTI-STOREY CAR PARK',
        'COVERED CAR PARK',
        'BASEMENT CAR PARK',
        'MECHANISED AND SURFACE CAR PARK'
      ]
      let carParkType = carParkArr.indexOf(aggrNode[0].car_park_type)
      let imgName = carParkArr[carParkType].replace(/ /g, '_').toLowerCase()

      if (Math.floor(text / 1e3) > 0) {
        text = `${(text / 1e3).toFixed(1)}K`
      }

      // node conf
      node.items = [{
        text: text,
        textStyle: {
          fillColor: '#fff',
          font: '14px Arial'
        },
        backgroundStyle: {
          fillColor: null,
          lineColor: null
        },
        padding: 5,
        scaleWithSize: true,
        px: 0,
        py: 0
      }]

      aggrNode.length == 1 && node.items.push({
        image: `img/${imgName}.png`,
        backgroundStyle: {
          fillColor: '#777',
          lineColor: null
        },
        maxWidth: 21,
        padding: 2,
        scaleWithSize: true,
        px: -0.7,
        py: -0.8,
        zIndex: 3
      })
    }
  }

  let getAvailableParkingLots = (node) => {
    let free = 0; let total = 0
    for (var i = 0; i < node.length; i++) {
      free += parseInt(node[i].carpark_info[0]['lots_available'])
      total += parseInt(node[i].carpark_info[0]['total_lots'])
    }
    return {
      procentage: Math.round(parseInt(free) * 100 / total),
      total,
      free
    }
  }

  let nodeSettingsFunction = (node, data) => {
    var aggr
    var pieData = { subvalues: [] }
    var radius = 0
    var carParkInfo = {
      lots_available: 0,
      total_lots: 0
    }

    if (window.enableAggregation) {
      aggr = data.aggregatedNodes
    } else {
      aggr = [data]
    }

    if (aggr.settingsApplied) {
      return {
        pie: { radius: node.removed ? 1e-30 : node.radius - 3, innerRadius: node.radius > 15 ? node.radius / 1.5 : 5 }
      }
    }

    aggr.settingsApplied = true

    if (aggr.length == 1) {
      for (var i = 0; i < aggr.length; i++) {
        var c = aggr[i]
        for (var j in c.carpark_info[0]) {
          if (hasProp.call(carParkInfo, j)) {
            carParkInfo[j] = c.carpark_info[0][j]
          }
        }
      }
    } else {
      for (var i = 0; i < aggr.length; i++) {
        var c = aggr[i]
        for (var j in c.carpark_info[0]) {
          if (hasProp.call(carParkInfo, j)) {
            carParkInfo[j] += parseInt(c.carpark_info[0][j])
          }
        }
      }
    }

    for (var key in carParkInfo) {
      if (hasProp.call(carParkInfo, key)) {
        if (key == 'total_lots') {
          key = 'lots_unavailable'
          carParkInfo[key] = Math.abs(parseInt(carParkInfo['total_lots']) - parseInt(carParkInfo['lots_available']))
        }

        // if parking lots not available then change color to transparent
        SLICES_COLOR[0] = '#51da2e'
        if (parseInt(carParkInfo['lots_available']) == 0) {
          SLICES_COLOR[0] = 'rgba(0,0,0,0)'
        }

        pieData.subvalues.push({
          value: carParkInfo[key],
          name: key,
          parentNode: data || null
        })
      }
    }

    return {
      pie: {
        radius: node.radius - 3,
        innerRadius: node.radius > 15 ? node.radius / 1.5 : 5,
        style: {
          sliceColors: SLICES_COLOR,
          colorDistribution: 'list'
        }
      },
      slice: {
        hoverStyle: {
          brightness: 1
        }
      },
      interaction: {
        selection: {
          enabled: false
        }
      },
      assetsUrlBase: './dist/assets/',
      data: {
        preloaded: pieData
      },
      events: {
        onClick(event, args) {
          if (args.clickPie) {
            let parentNode = args.clickPie.data.values[0].parentNode
            let map = geoChart.leaflet()
            if (parentNode.aggregatedNodes.length && parentNode.aggregatedNodes.length > 1) {
              zoomLevel = geoChart.zoomLevel(); zoomLevel++
              if (map) {
                parentNode.coordinates[0] > 100 && parentNode.coordinates.reverse()
                map.panTo(parentNode.coordinates)
                setTimeout(() => {
                  geoChart.zoomLevel(zoomLevel)
                  geoChart.updateStyle()
                }, 200)
              }
            } else {
              let id = parentNode.id.split('aggr_')[1]
              if (nodePositionArr[id]) {
                temp.carparkPopup(nodePositionArr[id])
              }
            }
          }
        }
      },
      labels: { enabled: false },
      info: {
        enabled: false
      }
    }
  }

  //
  let gcSettings = {
    data: {
      id: 'carPark',
      preloaded: {
        nodes: opt
      }
    },
    assetsUrlBase: './dist/assets/',
    events: {
      onClick: showCarParkData,
      onPositionChange: updateCarParkData,
      onChartUpdate: updateCarParkData
    },
    navigation: {
      initialLat: 1.358743,
      initialLng: 103.806350,
      initialZoom: 12,
      minZoom: 0,
      maxZoom: 18
    },
    nodeMenu: {
      enabled: false
    },
    filters: {
      nodeFilter: function (node) {
        return true
      }
    },
    layerTypes: {
      items: {
        style: {
          item: {
            scaleWithZoom: false,
            scaleWithSize: false
          }
        }
      }
    },
    layers: [
      {
        id: 'piePositions',
        name: 'Points',
        type: 'items',
        data: {
          id: 'carPark'
        },
        aggregation: {
          enabled: true,
          distance: 70,
          weightFunction: function (node) {
            let carparkInfo = node.carpark_info[0]
            let free = carparkInfo.lots_available
            return parseInt(free)
          }
        },
        style: {
          nodeAutoScaling: null,
          nodeStyleFunction: function (node) {
            var r
            var carParkInfo = {
              total_lots: 0,
              lots_available: 0
            }

            var aggr
            if (window.enableAggregation) {
              aggr = node.data.aggregatedNodes
            } else {
              aggr = [node]
            }

            if (aggr.length == 1) {
              let id = aggr[0].id.split('-')[0]
              node.label = ''

              let nodeEle = aggr[0].data ? aggr[0].data : aggr

              // get node radius
              r = getAvailableParkingLots(nodeEle).procentage * 0.4
              let freeParkingLots = getAvailableParkingLots(nodeEle).free

              // set min radius
              if (r < 20) r = 20

              // set node parm
              setNodeItem(node, r, freeParkingLots.toString())

              // set node position x, y for popup
              let nodeId = node.id.split('aggr_')[1]
              if (node.shape) {
                nodePositionArr[nodeId] = {
                  aggregatedNodes: node.data.aggregatedNodes,
                  nCoord: {
                    x: node.shape.x,
                    y: node.shape.y,
                    r: r
                  }
                }
              }

              node.radius = r
            } else {
              node.display = 'image'
              node.label = ''

              // get node radius
              r = getAvailableParkingLots(node.data.aggregatedNodes).procentage * 0.55
              let freeParkingLots = getAvailableParkingLots(node.data.aggregatedNodes).free

              // set min radius
              if (r < 20) r = 20

              // set node param
              setNodeItem(node, r, `${Math.round(freeParkingLots)}`)

              node.radius = r
            }
          },
          node: {
            radius: void 0,
            fillColor: 'rgba(0, 0, 0, 0.9)',
            lineColor: null,
            label: '',
            display: 'droplet',
            cursor: 'pointer'
          },
          nodeHovered: {
            fillColor: 'rgba(0,0,0,0.8)',
            shadowBlur: 1
          },
          nodeSelected: {
            fillColor: 'rgba(0,0,0,0.8)',
            shadowBlur: 1
          },
          nodeLabel: {
            backgroundStyle: {
              fillColor: 'rgba(0, 0, 0, 0.9)',
              lineColor: 'rgba(0, 0, 0, 0.9)'
            },
            textStyle: {
              fillColor: '#ccc'
            }
          },
          removedColor: null,
          aggregatedShape: {
            lineColor: 'rgba(0,0,0,.6)',
            fillColor: 'rgba(0,0,0,.2)'
          }
        }
      }, {
        id: 'pie',
        type: 'charts',
        shapesLayer: 'piePositions',
        chartType: 'piechart',
        settingsFunction: nodeSettingsFunction
      }
    ]
  }
  return gcSettings
}
