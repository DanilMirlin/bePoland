mapboxgl.accessToken = 'pk.eyJ1IjoiYS15b3V6ZWVyIiwiYSI6ImNrMXlzbnlsMjA1eW4zZHRsOHN4ZGtmcGcifQ.g3mLxdMPhRY4zMavGx43FA';

function checkImage(image) {

    var filename = image.files[0].name;
    var file_ext = $('#picture').val().split('.').pop().toLowerCase();
    var file_size = (image.files[0].size);

    $('.alert').hide();

    $('label[for="picture"]').html(filename);

    if ($.inArray(file_ext, ['jpg', 'jpeg']) > -1) { /* Image format (type) accepted */

        $('#err_type').hide();

        if (file_size > 1000000) {/* File size denied */
            $('#err_size b').html(bytesToSize(file_size) + '  <span class="font-weight-normal">(' + file_size + ' bytes)</span>');
            $('#err_size').show();

        } else {/* File size accepted */
            $('#err_size').hide();
            processImage(image);
        }

    } else {/* Image format (type) denied */

        $('label[for="picture"]').html('Choose image...');
        $('#err_type b').html(file_ext.toUpperCase() + '  <span class="font-weight-normal">( image: "' + filename + '")</span>');
        $('#err_type').show();
        $('#err_size').hide();
    }
}

function processImage(image) {

    EXIF.getData(image.files[0], function () {

        var exifData = EXIF.pretty(this);
        var lng = EXIF.getTag(image.files[0], 'GPSLongitude');
        var lat = EXIF.getTag(image.files[0], 'GPSLatitude');

        if (exifData && lng && lat) {
            lng = toDecimal(lng);
            lat = toDecimal(lat);
            var thmb = makePreview(image);
            var liID = 'img_' + image.files[0].name.split('.').join('_') ;

            $('#imageList').append(
                '<li class="list-group-item d-flex justify-content-between align-items-center p-1" id="' + liID + '">' +
                '<span>' + image.files[0].name + '</span>' +
                '<span>' + bytesToSize(image.files[0].size) + '</span>' +
                '<span class="small">Latitude: ' + lat + '<br>Longitude: ' + lng + '</span>' +
                '<span class="pointer"><i class="remove" onclick="$(this).closest(\'li\').remove();  drawMap()">x</i></span>' +
                '</li>'
            );
            $('#' + liID).prepend(thmb);

            setTimeout(() => {

                $('li#' + liID + ' img')
                    .attr('data-toggle', 'tooltip')
                    .attr('data-html', 'true')
                    .attr('data-placement', 'right')
                    .attr('title', '<pre class="exif-info">' + exifData + '</pre>');

                $('li#' + liID).data(
                    {
                        "type": "Feature",
                        "properties": {
                            "message": "Foo",
                            "iconSize": [72, 72],
                            "imgsrc": ""
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [lng, lat]
                        }
                    }
                );

                $('[data-toggle="tooltip"]').tooltip();

                drawMap();

            }, 600)

        } else {
            console.log("No EXIF data found in image '" + image.files[0].name + "'.");
            $('#err_exif b').html('<span class="font-weight-normal">"' + image.files[0].name + '"</span>');
            $('#err_exif').show();
        }
    });
}

function makePreview(image) {
    var file = image.files[0];

    var img = document.createElement("img");
    img.classList.add("img-thumbnail", "h72");
    img.file = file;
    img.height = 60;

    var reader = new FileReader();
    reader.onload = (function (aImg) {
        return function (e) {
            aImg.src = e.target.result;
        };
    })(img);
    reader.readAsDataURL(file);

    return img;
}

function drawMap() {

    var map = new mapboxgl.Map({
        container: 'mapBox',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [11.885126666663888, 43.46744833333334],
        zoom: 15
    });

    $.each($('#imageList > li'), (k, v) => {

        var geoData = $(v).data();

        map.setCenter(geoData.geometry.coordinates);

        var img = v.getElementsByTagName('img')[0];

        var el = document.createElement('div');
        el.className = 'marker';
        el.append(img.cloneNode(true));
        el.style.width = geoData.properties.iconSize[0] + 'px';
        el.style.height = geoData.properties.iconSize[1] + 'px';

        new mapboxgl.Marker(el)
            .setLngLat(geoData.geometry.coordinates)
            .addTo(map);

    });
}

/* Helpers */

function toDecimal(number) {
    return number[0].numerator + number[1].numerator /
        (60 * number[1].denominator) + number[2].numerator / (3600 * number[2].denominator);
}

function bytesToSize(bytes) {
    if (bytes === 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + ['Bytes', 'KB', 'MB', 'GB', 'TB'][i];
}


