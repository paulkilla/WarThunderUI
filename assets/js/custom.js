
$(document).ready(function() {
  var dialog,
    autoOpen = true,
    playerName = $( "#playerName" ),
    endpoint = $( "#endpoint" ),
    squadMembers = $( "#squadMembers" ),
    squadMembersEndpoint = $( "#squadMembersEndpoint" ),
    allFields = $( [] ).add( playerName ).add( endpoint ).add( squadMembers ).add( squadMembersEndpoint );
  if (localStorage.getItem("playerName") !== null) {
    playerName.val(localStorage.getItem('playerName'));
  }

  if (localStorage.getItem("endpoint") !== null) {
    endpoint.val(localStorage.getItem('endpoint'));
  }

  if (localStorage.getItem("squadMembers") !== null) {
    squadMembers.val(localStorage.getItem('squadMembers'));
  }

  if (localStorage.getItem("squadMembersEndpoint") !== null) {
    squadMembersEndpoint.val(localStorage.getItem('squadMembersEndpoint'));
  }

  if (localStorage.getItem("playerName") !== null && localStorage.getItem("endpoint") !== null) {
    autoOpen = false;
  }

  function checkLength( o, n, min, max ) {
    if ( o.val().length > max || o.val().length < min ) {
      o.addClass( "ui-state-error" );
      updateTips( "Length of " + n + " must be between " +
        min + " and " + max + "." );
      return false;
    } else {
      return true;
    }
  }

  function saveData() {
    var valid = true;
    allFields.removeClass( "ui-state-error" );

    valid = valid && checkLength( playerName, "playerName", 1, 100 );
    valid = valid && checkLength( endpoint, "endpoint", 6, 100 );
    if ( valid ) {
      localStorage.setItem("playerName", playerName.val());
      localStorage.setItem("endpoint", endpoint.val());
      localStorage.setItem("squadMembers", squadMembers.val());
      localStorage.setItem("squadMembersEndpoint", squadMembersEndpoint.val());
      if (localStorage.getItem("playerName") !== null) {
        playerName.val(localStorage.getItem('playerName'));
      }

      if (localStorage.getItem("endpoint") !== null) {
        endpoint.val(localStorage.getItem('endpoint'));
      }

      if (localStorage.getItem("squadMembers") !== null) {
        squadMembers.val(localStorage.getItem('squadMembers'));
      }

      if (localStorage.getItem("squadMembersEndpoint") !== null) {
        squadMembersEndpoint.val(localStorage.getItem('squadMembersEndpoint'));
      }
    }
    return valid;
  }

  $( "#settingsSave" ).on( "click", function( event ) {
    event.preventDefault();
    if(saveData()) {
      $('#settingsModal').modal('hide');
    } else {
      console.log('Invalid Settings');
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

  if(showMyInstruments != null && showMyInstruments === 'true') {
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


  const navBarHeight = $('nav.navbar').height();
  const instrumentsHeight = $('div#instruments-div').height();
  const cardHeaderHeight = $('.card-header').height();
  const totalHeight = navBarHeight + instrumentsHeight + cardHeaderHeight + 25;
  const windowHeight = $(window).height();
  const resizableHeight = windowHeight - totalHeight;
  $('.resizable-div').each(function() {
    $(this).height(resizableHeight + 'px');
  });
});


function timeSince(timeStamp) {
  var now = new Date(),
  secondsPast = (now.getTime() - timeStamp) / 1000;
  return parseInt(secondsPast) + 's ago';
}
