
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

  const interval = setInterval(function() {
    $('.hidden-last-seen').each(function() {
      var timestamp = $(this).text();
      $(this).prev('.show-last-seen').text(timeSince(timestamp));
    });
  }, 2000);

});

function timeSince(timeStamp) {
  var now = new Date(),
  secondsPast = (now.getTime() - timeStamp) / 1000;
  return parseInt(secondsPast) + 's ago';
}
