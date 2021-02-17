
$(document).ready(function() {
  $('#settingsFormLinks a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

  $('[data-toggle="tooltip"]').tooltip();

  let autoOpen = true,
    playerName = $( "#playerName" ),
    endpoint = $( "#endpoint" ),
    squadName = $( "#squadName" ),
    speedSettings = $("#speedSettings"),
    altitudeSettings = $("#altitudeSettings"),
    distanceSettings = $("#distanceSettings"),
    climbSpeedSettings = $("#climbSpeedSettings"),
    temperatureSettings = $("#temperatureSettings"),
    allFields = $( [] ).add( playerName ).add( endpoint ).add( squadName );
  if (localStorage.getItem("playerName") !== null) {
    playerName.val(localStorage.getItem('playerName'));
  }

  if (localStorage.getItem("endpoint") !== null) {
    endpoint.val(localStorage.getItem('endpoint'));
  } else {
    endpoint.val("http://localhost:8111");
  }

  if (localStorage.getItem("speedSetting") !== null) {
    speedSettings.val(localStorage.getItem("speedSetting"));
  } else {
    speedSettings.val('km/h');
  }

  if (localStorage.getItem("altitudeSetting") !== null) {
    altitudeSettings.val(localStorage.getItem("altitudeSetting"));
  } else {
    altitudeSettings.val('m');
  }

  if (localStorage.getItem("distanceSetting") !== null) {
    distanceSettings.val(localStorage.getItem("distanceSetting"));
  } else {
    distanceSettings.val('km');
  }

  if (localStorage.getItem("climbSpeedSetting") !== null) {
    climbSpeedSettings.val(localStorage.getItem("climbSpeedSetting"));
  } else {
    climbSpeedSettings.val('m/sec');
  }

  if (localStorage.getItem("temperatureSetting") !== null) {
    temperatureSettings.val(localStorage.getItem("temperatureSetting"));
  } else {
    temperatureSettings.val('C');
  }

  if (localStorage.getItem("squadName") !== null) {
    squadName.val(localStorage.getItem('squadName'));
  }

  function checkLength( o, n, min, max ) {
    if ( o.val().length > max || o.val().length < min ) {
      o.removeClass("is-valid");
      o.addClass( "is-invalid" );
      return false;
    } else {
      o.removeClass("is-invalid");
      o.addClass("is-valid");
      return true;
    }
  }

  function saveData() {
    let valid = true;

    valid = valid && checkLength( playerName, "playerName", 1, 100 );
    valid = valid && checkLength( endpoint, "endpoint", 6, 100 );
    valid = valid && checkLength( squadName, "squadName", 1, 100 );
    if(valid) {
      localStorage.setItem("playerName", playerName.val());
      localStorage.setItem("endpoint", endpoint.val());
      if (localStorage.getItem("playerName") !== null) {
        playerName.val(localStorage.getItem('playerName'));
      }

      if (localStorage.getItem("endpoint") !== null) {
        endpoint.val(localStorage.getItem('endpoint'));
      }
      localStorage.setItem("speedSetting", speedSettings.val());
      localStorage.setItem("altitudeSetting", altitudeSettings.val());
      localStorage.setItem("distanceSetting", distanceSettings.val());
      localStorage.setItem("climbSpeedSetting", climbSpeedSettings.val());
      localStorage.setItem("temperatureSetting", temperatureSettings.val());
      localStorage.setItem("squadName", $('#squadName').val());
      window.initComponentReference.zone.run(() => { window.initComponentReference.loadAngularFunction(); });
    }
    return valid;
  }

  $( "#settingsSave" ).on( "click", function( event ) {
    event.preventDefault();
    if(saveData()) {
      $('#settingsModal').modal('hide');
    }
  });

  if(autoOpen) {
    $("#settingsModal").modal();
  }
  var showAlways = localStorage.getItem('showAlways');
  var showMyInstruments = localStorage.getItem('showMyInstruments');
  if(showAlways != null && showAlways === 'true') {
    $('#showAlways').prop('checked', true);
  } else {
    $('#showAlways').prop('checked', false);
  }

  if(showMyInstruments== null || (showMyInstruments != null && showMyInstruments === 'true')) {
    $('#showMyInstruments').prop('checked', true);
  } else {
    $('#showMyInstruments').prop('checked', false);
  }

  $('#showAlways').on('change', function() {
    var checked = $(this).is(":checked");
    if (checked) {
      localStorage.setItem('showAlways', true);
    } else {
      localStorage.setItem('showAlways', false);
    }
  });

  $('#showMyInstruments').on('change', function() {
    var checked = $(this).is(":checked");
    if (checked) {
      localStorage.setItem('showMyInstruments', true);
    } else {
      localStorage.setItem('showMyInstruments', false);
    }
  });

  const interval = setInterval(function() {
    $('.hidden-last-seen').each(function() {
      var timestamp = $(this).text();
      $(this).prev('.show-last-seen').text(timeSince(timestamp));
    });
  }, 2000);
  $.fn.sparkline.defaults.common.height = '50px';
  $.fn.sparkline.defaults.common.width = '150px';
  $.fn.sparkline.defaults.common.fillColor = '#4b75cf';
  $.fn.sparkline.defaults.common.lineColor = '#4b75cf';
  setTimeout(function () {
    resizeResizables();
  }, 1000);

  $(window).on('resize', function() {resizeResizables();});
});

function resizeResizables() {
  const navBarHeight = $('nav.navbar').height();
  const instrumentsHeight = $('div#instrument-div').height();
  const mapHeight = $('div#map-div').height();
  const cardHeaderHeight = $('.card-header').height();
  const totalHeightRight = navBarHeight + instrumentsHeight + cardHeaderHeight + 100;
  const totalHeightLeft = navBarHeight + mapHeight + cardHeaderHeight + 100;
  const windowHeight = $(window).height();
  const resizableHeightRight = windowHeight - totalHeightRight;
  const resizableHeightLeft = windowHeight - totalHeightLeft;
  $('.resizable-div').each(function() {
    $(this).height(resizableHeightRight + 'px');
    $(this).css('min-height', '20em');
  });
  $('.resizable-div-map').each(function() {
    $(this).height(resizableHeightLeft + 'px');
    $(this).css('min-height', '15.2em');
  });
}

function timeSince(timeStamp) {
  var now = new Date(),
  secondsPast = (now.getTime() - timeStamp) / 1000;
  return parseInt(secondsPast) + 's ago';
}

function showNotification(from, align, message, type, timer, allow_dismiss){
  $.notify({
    message: message
  },{
    type: type,
    timer: timer,
    placement: {
      from: from,
      align: align
    },
    allow_dismiss: allow_dismiss
  });
}
