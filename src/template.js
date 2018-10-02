import $ from 'jquery'

export default class Template {
  menulist (node) {
    let list = []
    let that = this

    node.forEach((e, i) => {
      let carParkInfo = e.carpark_info[0]
      let markerClass = 'green'
      let free = carParkInfo.lots_available
      let taken = carParkInfo.total_lots - free
      let freePorcentage = Math.round(carParkInfo.lots_available * 100 / carParkInfo.total_lots)
      let icon = that.getActiveIcon(e)

      if (freePorcentage >= 0 && freePorcentage <= 30) {
        markerClass = 'red'
      }
      if (freePorcentage > 30 && freePorcentage <= 70) {
        markerClass = 'orange'
      }

      list.push({
        values: {
          id: e.id,
          graph: {
            free,
            taken
          },
          title: {
            car_park_no: e.car_park_no,
            address: e.address
          },
          infoList: {
            dataLotType: icon.lotType,
            shortTermParking: icon.shortTermParking,
            carParkType: icon.carParkType,
            freeParking: icon.freeParking,
            nightParking: icon.nightParking
          }
        },
        markup: `<li id='${e.id}' class="item">
                            <ul class="item-content-wrapper">
                                <li class="graph-wrapper">
                                    <ul>
                                        <li class='free'>${free}</li>
                                        <li class='taken'>${taken}</li>
                                    </ul>
                                    <div class="graph">
                                        <div class="graph-inner" style="--total-carpark-count: ${freePorcentage}%"></div>
                                    </div>
                                </li>
                                <li class="title-wrapper">
                                    <div class="icon ${markerClass}"></div>
                                    <div class="title-inner-wrapper">
                                        <span class="carpark-id">${e.car_park_no}</span>
                                        <span class="carpark-address">${e.address}</span>
                                    </div>
                                </li>
                                <li class="info-wrapper">
                                    <ul class="info-list">
                                        <li data-lot-type="${icon.lotType}" title="Lot type: ${carParkInfo.lot_type}" class="lot-type">${carParkInfo.lot_type}</li>
                                        <li data-short_term_parking="${icon.shortTermParking}" title="Short term parking: ${e.short_term_parking}" class="short_term_parking"></li>
                                        <li data-car-park-type="${icon.carParkType}" title="Carpark type: ${e.car_park_type}" class="carpark-type"></li>
                                        <li data-free_parking="${icon.freeParking}" title="Free parking: ${e.free_parking}" class="free_parking"></li>
                                        <li data-night_parking="${icon.nightParking}" title="Night parking: ${e.night_parking}" class="night-parking"></li>
                                        <li id="close-list-item" class="close-btn">&times;</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>`,
        active: true
      })
    })

    return list
  }

  menuListHeader (data) {
    let totalCarParkingData = {
      total: 0,
      free: 0,
      taken: 0
    }
    let sectionTopHeader = $('.section.section-top .header-wrapper')
    let freePorcentage = 0
    data.forEach(e => {
      let carParkInfo = e.carpark_info[0]
      let lotsUnavailable = 0

      // total lots counting
      totalCarParkingData.total += parseInt(carParkInfo['total_lots'])

      lotsUnavailable = Math.abs(parseInt(carParkInfo['total_lots']) - parseInt(carParkInfo['lots_available']))

      // unavailable lots counting
      totalCarParkingData.taken += parseInt(lotsUnavailable)

      // available lots counting
      totalCarParkingData.free += parseInt(carParkInfo['lots_available'])
    })
    sectionTopHeader
      .children('.title')
      .text(`${totalCarParkingData.total} parking lots`)
    sectionTopHeader
      .find('.left')
      .text(`${totalCarParkingData.free} free`)
    sectionTopHeader
      .find('.right')
      .text(`${totalCarParkingData.taken} taken`)
    freePorcentage = totalCarParkingData.free * 100 / totalCarParkingData.total
    sectionTopHeader
      .find('.graph-inner')
      .attr('style', `--total-carpark-count: ${Math.round(freePorcentage)}%`)
  }

  carparkPopup (data) {
    let d = data.aggregatedNodes[0]
    let coord = data.nCoord
    let icon = this.getActiveIcon(d)
    let carParkHtml = `
        <div class='data-wrapper'>
            <div class="inner-wrapper left">
                <div id="close-popup-btn" class="close-popup-btn">&times;</div>
                <div class="carpark-id-wrapper">
                    <div class="header">Car Park No.:</div>
                    <div class="body">${d.carpark_number}</div>
                </div>
            </div>
            <div class="inner-wrapper right">
                <div class="header">
                    <div class="title">Address:</div>
                    <div class="address">${d.address}</div>
                </div>
                <div class="content">
                    <ul class='carPark-data'>
                        <li>
                            <span class="icon" data-car-park-type="${icon.carParkType}"></span>
                            <span class="title">Car Park Type:</span>
                            <span class="text">${d.car_park_type}</span>
                        </li>
                        <li>
                            <span class="icon" data-lot-type="${icon.lotType}" ></span>
                            <span class="title">Type Of Parking System:</span>
                            <span class="text">${d.type_of_parking_system}</span>
                        </li>
                        <li>
                            <span class="icon" data-short_term_parking="${icon.shortTermParking}"></span>
                            <span class="title">Short Term Parking:</span>
                            <span class="text">${d.short_term_parking}</span>
                        </li>
                        <li>
                            <span class="icon" data-free_parking="${icon.freeParking}"></span>
                            <span class="title">Free Parking:</span>
                            <span class="text">${d.free_parking}</span>
                        </li>
                        <li>
                            <span class="icon" data-night_parking="${icon.nightParking}"></span>
                            <span class="title">Night Parking:</span>
                            <span class="text">${d.night_parking}</span>
                        </li>
                    </ul>  
                </div>             
            </div>
        </div>`

    let x = coord.x
    let y = coord.y
    let r = coord.r
    let margin = 30
    let chartWrapper = $('.chart-wrapper')

    chartWrapper.find('.data-wrapper').remove()
    chartWrapper.append(carParkHtml)

    let h = chartWrapper.find('.data-wrapper').outerHeight()
    let w = chartWrapper.find('.data-wrapper').outerWidth()
    let top = () => {
      if (y < (h + r + margin)) {
        return y + r + margin
      }
      return y - h - r - margin
    }

    let left = () => {
      let chartWidth = chartWrapper.outerWidth()

      if (x < ((w / 2) + r + margin)) {
        return x
      } else if (x > (chartWidth - (w / 2) - margin)) {
        return x - w - margin
      }
      return x - (w / 2)
    }

    chartWrapper.find('.data-wrapper').addClass('active')
    if ($(window).width() > 960) {
      chartWrapper.find('.data-wrapper').css({
        top: top,
        left: left,
        margin: 'unset'
      })
    }
  }

  getActiveIcon (e) {
    let infoListArr = {
      car_park_type: [
        'SURFACE CAR PARK',
        'MULTI-STOREY CAR PARK',
        'BASEMENT CAR PARK',
        'COVERED CAR PARK',
        'MECHANISED AND SURFACE CAR PARK'
      ],
      free_parking: ['NO', 'YES', 'SUN & PH FR 7AM-10.30PM', 'SUN & PH FR 1PM-10.30PM'],
      night_parking: ['YES', 'NO'],
      short_term_parking: ['WHOLE DAY', 'NO', '7AM-10.30PM'],
      lot_type: ['C', 'Y', 'H', 'L']
    }
    let carParkInfo = e.carpark_info[0]
    let lotType = infoListArr.lot_type.indexOf(carParkInfo.lot_type)
    let shortTermParking = infoListArr.short_term_parking.indexOf(e.short_term_parking)
    let carParkType = infoListArr.car_park_type.indexOf(e.car_park_type)
    let freeParking = infoListArr.free_parking.indexOf(e.free_parking)
    let nightParking = infoListArr.night_parking.indexOf(e.night_parking)

    return {
      lotType,
      shortTermParking,
      carParkType,
      freeParking,
      nightParking
    }
  }
}
