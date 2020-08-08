// let apiKeyV2 = "rqz7xyyqush2cn5m838nffdy";

$(() => {



    var abbreviations = {
        "Adelaide Crows": "ADE",
        "Brisbane Lions": "BRI",
        "Carlton Blues": "CBL",
        "Collingwood Magpies": "COL",
        "Essendon Bombers": "ESS",
        "Fremantle Dockers": "FRE",
        "Geelong Cats": "GEE",
        "Gold Coast Suns": "GCS",
        "GWS Giants": "GWS",
        "Hawthorn Hawks": "HAW",
        "Melbourne Demons": "MEL",
        "North Melbourne Kangaroos": "NMK",
        "Port Adelaide Power": "PAP",
        "Richmond Tigers": "RIC",
        "St Kilda Saints": "SKS",
        "Sydney Swans": "SYD",
        "West Coast Eagles": "WCE",
        "Western Bulldogs": "BUL"
    };

    $(".toggleCollapse").on("click", () => {
        $('.ladder table').toggleClass("collapse");
    })

  

    let standingsUrl = "https://corsaway.herokuapp.com/proxy?url=https://api.sportradar.com/australianrules/trial/v2/en/seasons/sr:season:72434/standings.json?api_key=rqz7xyyqush2cn5m838nffdy";
    fetch(standingsUrl)
        .then(response => {
            return response.json();
        })
        .then(json => {
            for (let team of json.standings[0].groups[0].team_standings) {


                // add table row to standings table with competitorId attribute that can be used later once link clicked
                $(".standings").append(`<tr>
                                     <td>${team.competitor_standing.rank}</td>
                                     <td>
                                        <a href="#match-info" class="team" competitorId="${team.competitor_standing.competitor.id}"> 
                                            <img src="assets/imgs/${abbreviations[team.competitor_standing.competitor.name]}.png">
                                            <span class="abbreviation">${abbreviations[team.competitor_standing.competitor.name]}</span>
                                        </a>
                                    </td>
                                     <td>
                                         <a href="#match-info" class="team" competitorId="${team.competitor_standing.competitor.id}">${team.competitor_standing.competitor.name}</a>
                                     </td>
                                     
                                     <td>${team.competitor_standing.played}</td>
                                     <td>${team.competitor_standing.win}</td>
                                     <td>${team.competitor_standing.loss}</td>
                                     <td>${team.competitor_standing.draw}</td>
                                     </tr>`);
            };
        });

    $("body").on("click", ".team", function (event) {

        let target = event.target;
        console.log(target)
        if ($(event.target).first().tagName != "A") {
           target = $(event.target).closest("a");
        }
        
        let id = $(target).attr("competitorId"); // store attribute of clicked competitorId
        fetchSeasonDetails("sr:season:72434").then(function (json) {

            let matches = filterMatchesByTeam(json, id);

            $(".matches").html(""); //clearing in case team fixtures already loaded.

            for (let i = 0; i < matches.length; i++) {

                let match = matches[i];
                let matchId = match.sport_event.id;


                // add list element to matches list with matchId attribute that can be used later once link clicked
                $(".matches").append(`<li style="padding-left:10px;"> <a href="#match-info" class="match" matchId="${matchId}">${match.sport_event.sport_event_context.stage.round} - ${match.sport_event.competitors[0].abbreviation} vs ${match.sport_event.competitors[1].abbreviation}</a></li>`)
            }

            $("#match-info").show()

            let latestMatch = getLatestMatchWithStatistics(matches);
            console.log(latestMatch);
            // $("latestMatch"); // want to show the match when I find the latest match
        });

    })

    function getLatestMatchWithStatistics(matches) {

        let completeMatches = [];

        for (let i = 0; i < matches.length; i++) {
            let currentMatch = matches[i];

            let currentMatchKeys = Object.keys(currentMatch);

            if (currentMatchKeys.includes("statistics") || currentMatch.sport_event_status.status === "live") {
                completeMatches.push(currentMatch)
            };

        }


        return completeMatches.pop();
    };


    $("body").on("click", ".match", function (event) {

        let id = $(event.target).attr("matchId"); // store matchId attribute of clicked element 

        fetchMatchTimeline(id).then(function (json) {

            let i = 0;
            let currentPeriod = 1;

            $(".period").hide();
            $(".period1").show();
            $(".timeline .period-events").html(`<hr class="timeline-splitter" />`); // clearing contents in case already selected match fixture
            while (i < json.timeline.length) {
                let timelineEvent = json.timeline[i];

                let teamType = "neither";

                if (typeof timelineEvent.team !== "undefined") {
                    teamType = timelineEvent.team;
                }


                // let periodClass = timeline_event.period_name.toLowerCase().replace(" ", "");
                // $(`.${periodClass}.timeline`).append()
                // TO BE USED WITH ADDING TIMELINE EVENTS TO RELEVANT SECTIONS



                // let timelineEventNode = `<div class="timeline-event ${teamType}">
                //                             <div class="card timeline-content">
                //                                 <span class="card-title gradient white-text text-darken-4">${timelineEvent.type}</span>
                //                             </div>
                //                             <div class="timeline-badge red lighten-3 white-text"></div>
                //                         </div>`;

                // if (teamType != "neither") $(".timeline").append(timelineEventNode);



                // using a switch instead of if/else statements because there is a defined number of options available for timeline event types 
                switch (timelineEvent.type) {
                    case "match_started":
                        console.log("match_started")
                        break;
                    case "period_start":
                        console.log("period_start");
                        console.log(currentPeriod);


                        break;
                    case "score_change":
                        console.log("score_change")

                        $(`.timeline .period${currentPeriod} .period-events`).append(`<div class="timeline-event ${timelineEvent.team}">
                                                                <div class="event-badge">${timelineEvent.match_time}</div>
                                                                <div class="event-content">

                                                                    ${timelineEvent.home_score} - ${timelineEvent.away_score}
                                                                </div>
                                                            </div>`);
                        break;
                    case "period_score":
                        console.log("period_score")
                        currentPeriod++;
                        break;
                    case "break_start":
                        console.log("break_start")
                        break;
                    case "match_ended":
                        console.log("match_ended")
                        break;
                }

                i++;

            }
        })

    });

    $(".period-selector").on("click", function (event) {
        let id = $(event.target).attr("period");
        console.log(id);
        $(".period").hide();

        $(`.${id}`).show();



    })

    function filterMatchesByTeam(json, id) {
        let matches = [];
        for (let i = 0; i < json.summaries.length; i++) {

            let match = json.summaries[i];

            if (match.sport_event_status.status === "cancelled") {
                continue;
            }
            if (match.sport_event.competitors[0].id === id || match.sport_event.competitors[1].id === id) {
                matches.push(match);
            }
        }

        return matches;
    }

    // reusable function to get the season details from the api

    function fetchSeasonDetails(id) {

        return fetch(`https://corsaway.herokuapp.com/proxy?url=https://api.sportradar.com/australianrules/trial/v2/en/seasons/${id}/summaries.json?api_key=rqz7xyyqush2cn5m838nffdy`)
            .then(function (response) {
                return response.json();
            });

    }

    function fetchMatchTimeline(matchId) {
        let timelineUrl = `https://corsaway.herokuapp.com/proxy?url=https://api.sportradar.com/australianrules/trial/v2/en/match/${matchId}/timeline.json?api_key=rqz7xyyqush2cn5m838nffdy`
        return fetch(timelineUrl)
            .then(function (response) {
                return response.json();
            });
    }
});

// Button on(click) events