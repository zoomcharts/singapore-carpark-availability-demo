import { Utm } from 'geodesy'

export let loadChartData = (urls) => {
  let searchElById = (data, id) => {
    return data.filter(
      (d) => {
        return id == d.car_park_no && d
      }
    )
  }

  let checkStatus = (response) => {
    if (response.ok) {
      return Promise.resolve(response)
    } else {
      return Promise.reject(new Error(response.statusText))
    }
  }

  let parseJSON = (response) => {
    return response.json()
  }

  let returnDataPromise = Promise.all(urls.map(url =>
    fetch(url)
      .then(checkStatus)
      .then(parseJSON)
      .catch(error => console.log('There was a problem!', error))
  )).then(data => {
    let settings = []
    let options = []

    //
    if (data[0].items) {
      settings.push(data[0].items[0].carpark_data)
    }

    //
    if (data[1].result) {
      if (settings.length) {
        // set up data: merge data
        settings[0].forEach((element, i) => {
          if (parseInt(element.carpark_info[0].total_lots) > 0) {
            let cData = searchElById(data[1].result.records, element.carpark_number)

            //
            if (cData[0]) {
              let lat = parseInt(cData[0].x_coord)
              let lon = parseInt(cData[0].y_coord)

              let utmCoord = new Utm('48', 'N', lat, lon)
              let toLatLonE = utmCoord.toLatLonE()

              // merge obj
              const newItem = Object.assign({}, {
                id: `${element.carpark_number}-${i}`,
                coordinates: [toLatLonE.lon + 3.07156, toLatLonE.lat + 1.01705]
              }, element, cData[0])
              options.push(newItem)
            }
          }
        })
      }
    }
    return options
  })
  return returnDataPromise
}
