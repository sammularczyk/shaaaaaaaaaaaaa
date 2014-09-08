var hasPushstate = Boolean(window.history && history.pushState);

$("form").on("submit", function(event) {
  var domain = $("#domain").val();
  if (domain) {
    var escaped = domain.replace(/^https?:\/\//i, "").replace(/[^\w\.\-]/g, "");
    checkDomain(escaped);
    if (hasPushstate) {
      history.pushState(escaped, null, "/check/" + escaped);
    }
  }
  
  event.preventDefault();
});

$(window).on("popstate", function(event) {
  var domain = event.originalEvent.state;
  if (domain) {
    checkDomain(domain);
  } else {
    // don't let mere anchor clicks trigger the event
    // console.log(event);
    if (window.location.pathname == "/")
      startOver();
  }
});

var display = {
  "sha256": "SHA-2",
  "sha512": "SHA-2",
  "sha384": "SHA-2",
  "sha224": "SHA-2",
  "sha1": "SHA-1",
  "md5": "MD5",
  "md2": "MD2"
};

var checkDomain = function(domain) {
  console.log("Checking domain: " + domain);

  $.ajax(
    {url: "/api/check/" + domain}
  )
  .done(function(data) {
    hideLoading();
    console.log("Done checking.");

    // transition from loading to main aswer body
    $("#results .result").hide();
    $("#results .result.answer").show();
    $('header h2').hide();

    // always fill in algorithm and domain
    $("#results .result .algorithm").html(display[data.cert.algorithm]);
    $("#results .result .domain").html(domain);
    $("a.ssllabs").attr("href", ssllabsUrl(domain));

    if (domain == "shaaaaaaaaaaaaa.com")
      $("#sha").show();
    else
      $("#sha").hide();

    // topline word: nice, almost, or dang?
    if (data.cert.good) {
      var intergood = true;
      for (var i=0; i<data.intermediates.length; i++) {
        if (!data.intermediates[i].good)
          intergood = false;
        break;
      }

      if (intergood)
        $("#results .result").addClass('good');
      else
        $("#results .result").addClass('almost');
    }

    // bad endpoint cert: just focus on that
    else {
      $("#results .result").addClass('bad');
    }

    // TODO: show details

  })
  .fail(function(xhr) {
    hideLoading();
    console.log("Done checking.");

    // load domain
    $("#results .result .domain").html(domain);

    // show results
    $("#results .result").hide();
    $("#results .result.error").show();
  });

  showLoading();
};

var ssllabsUrl = function(domain) {
  return "https://www.ssllabs.com/ssltest/analyze.html?d=" + encodeURIComponent(domain);
};

var showLoading = function() {
  $('header form').addClass('loading');
  console.log("Checking...");

  $("#domain").attr("disabled", true);
  $("input[type=submit]")
    .attr("disabled", true)
    .val("Checking...");
};

var hideLoading = function() {
  $('header form').removeClass('loading');
  $("#domain").attr("disabled", false);
  $("input[type=submit]")
    .attr("disabled", false)
    .val("Check \u2192");

  clearTimeout(loading);
};

var startOver = function() {
  console.log("Starting over.");

  hideLoading();
  $("#results .result").removeClass('good, almost, bad').hide();
  $("#results .result.form").show();
  $("#domain").select().focus();
  $('header h2').show();

  return false;
}
$(".start-over").on("click", startOver);

