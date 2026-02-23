const standings = [
  { team: "Bronx Bombers", w: 72, l: 41, pct: ".637", gb: "-", streak: "W4" },
  { team: "Lakeview Lynx", w: 68, l: 45, pct: ".602", gb: "4.0", streak: "L1" },
  { team: "Desert Coyotes", w: 63, l: 50, pct: ".558", gb: "9.0", streak: "W2" },
  { team: "River City Kings", w: 59, l: 54, pct: ".522", gb: "13.0", streak: "W1" },
  { team: "Bay Harbor Captains", w: 56, l: 57, pct: ".496", gb: "16.0", streak: "L3" },
  { team: "Northline Knights", w: 49, l: 64, pct: ".434", gb: "23.0", streak: "L2" }
];

const schedule = [
  { when: "Mon 7:05 PM", matchup: "Bronx Bombers @ Lakeview Lynx", note: "Game 1 of 3" },
  { when: "Tue 7:10 PM", matchup: "Desert Coyotes @ River City Kings", note: "National game" },
  { when: "Wed 1:10 PM", matchup: "Bay Harbor Captains @ Northline Knights", note: "Day game" },
  { when: "Thu 7:35 PM", matchup: "Lakeview Lynx @ Desert Coyotes", note: "Interdivision" }
];

const teams = [
  { name: "Bronx Bombers", park: "Empire Field", gm: "A. Cole", trend: "Aggressive buyers" },
  { name: "Lakeview Lynx", park: "Harbor Dome", gm: "M. Rivera", trend: "Pitching first" },
  { name: "Desert Coyotes", park: "Sunline Park", gm: "J. Ortiz", trend: "Young core rising" },
  { name: "River City Kings", park: "Crown Stadium", gm: "D. Grant", trend: "Power-heavy lineup" },
  { name: "Bay Harbor Captains", park: "Anchor Yards", gm: "S. Blake", trend: "Bullpen reset" },
  { name: "Northline Knights", park: "Forge Field", gm: "T. Wells", trend: "Retool season" }
];

const leaders = [
  { stat: "AVG", name: "L. Soto", value: ".337" },
  { stat: "HR", name: "C. Vega", value: "38" },
  { stat: "RBI", name: "M. Drake", value: "111" },
  { stat: "SB", name: "K. Tran", value: "42" },
  { stat: "ERA", name: "P. Hall", value: "2.41" },
  { stat: "K", name: "R. Steele", value: "219" }
];

const transactions = [
  { date: "Feb 22", type: "Trade", detail: "River City acquired SP Nolan Reed from Bay Harbor for two prospects." },
  { date: "Feb 21", type: "Call-up", detail: "Lakeview promoted INF Dax Keller to the active roster." },
  { date: "Feb 20", type: "Injury", detail: "Bronx placed RP Eli Fox on the 15-day IL (shoulder fatigue)." },
  { date: "Feb 19", type: "Signing", detail: "Northline signed OF Raul Pena to a one-year major league deal." }
];

const awards = [
  "<strong>MVP:</strong> C. Vega (Desert Coyotes)",
  "<strong>Cy Young:</strong> P. Hall (Lakeview Lynx)",
  "<strong>Rookie of the Year:</strong> D. Keller (Lakeview Lynx)",
  "<strong>Reliever of the Year:</strong> M. Hodge (Bronx Bombers)"
];

const draft = [
  "J. Rojas, SS, Pacific Coast U",
  "T. Brink, RHP, Great Plains State",
  "A. Miles, CF, Crescent Tech",
  "N. Park, C, Riverbend College",
  "E. Quinn, 3B, Metro East"
];

const expansion = [
  "<strong>Portland Pioneers:</strong> Ballpark financing at committee review stage.",
  "<strong>Nashville Rhythms:</strong> Ownership group secured primary investors.",
  "<strong>Montreal Voyageurs:</strong> International market feasibility report due next month."
];

const gmCenter = {
  waiverDeadline: "Sunday, March 8 at 11:59 PM league time.",
  tradeDeadline: "Friday, March 20 at 6:00 PM league time.",
  rulePoll: "Pitch clock reduction proposal: 61% in favor, 39% against.",
  commissionerNote:
    "All clubs must submit final 40-man roster compliance reports by Wednesday noon. Prospect eligibility audits will be run after lock."
};

function setHtml(id, html) {
  document.getElementById(id).innerHTML = html;
}

setHtml(
  "standingsBody",
  standings
    .map(
      (row) => `
      <tr>
        <td>${row.team}</td>
        <td>${row.w}</td>
        <td>${row.l}</td>
        <td>${row.pct}</td>
        <td>${row.gb}</td>
        <td>${row.streak}</td>
      </tr>`
    )
    .join("")
);

setHtml(
  "scheduleCards",
  schedule
    .map(
      (game) => `
      <article class="card">
        <h3>${game.when}</h3>
        <p>${game.matchup}</p>
        <p>${game.note}</p>
      </article>`
    )
    .join("")
);

setHtml(
  "teamCards",
  teams
    .map(
      (team) => `
      <article class="card">
        <h3>${team.name}</h3>
        <p><strong>Park:</strong> ${team.park}</p>
        <p><strong>GM:</strong> ${team.gm}</p>
        <p>${team.trend}</p>
      </article>`
    )
    .join("")
);

setHtml(
  "leaderGrid",
  leaders
    .map(
      (item) => `
      <article class="leader">
        <div class="label">${item.stat}</div>
        <div class="name">${item.name}</div>
        <div class="value">${item.value}</div>
      </article>`
    )
    .join("")
);

setHtml(
  "transactionFeed",
  transactions
    .map(
      (item) => `
      <li>
        <div class="meta">${item.date} • ${item.type}</div>
        <div>${item.detail}</div>
      </li>`
    )
    .join("")
);

setHtml("awardsList", awards.map((item) => `<li>${item}</li>`).join(""));
setHtml("draftList", draft.map((item) => `<li>${item}</li>`).join(""));
setHtml("expansionList", expansion.map((item) => `<li>${item}</li>`).join(""));

document.getElementById("waiverDeadline").textContent = gmCenter.waiverDeadline;
document.getElementById("tradeDeadline").textContent = gmCenter.tradeDeadline;
document.getElementById("rulePoll").textContent = gmCenter.rulePoll;
document.getElementById("commissionerNote").textContent = gmCenter.commissionerNote;

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
menuBtn.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => navLinks.classList.remove("show"));
});
