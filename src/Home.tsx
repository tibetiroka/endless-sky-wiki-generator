import {ReactElement, useState} from "react";
import {ChangeData} from "data/ChangeData.tsx";
import {fetchData} from "web_utils.ts";
import {Changelog} from "./components/Changelog.tsx";

function Home() {
	const [changelog, setChangelog] = useState(undefined as ReactElement | undefined);

	if (!changelog) {
		fetchData('data/changelog.json', 0)
			.then(json => JSON.parse(json))
			.then(data => {
				let changelog = data as ChangeData[];
				changelog = changelog.splice(0, changelog.length - 20);
				setChangelog(<Changelog entries={changelog.toReversed()}/>)
			});
	}

	return <>
		<h1>Home</h1>
		<section>
			<h2>Welcome to the Endless Sky Wiki!</h2>
			<p>Endless Sky is a 2D top-down sandbox style space exploration game inspired by <a href="https://en.wikipedia.org/wiki/Escape_Velocity_(video_game)">Escape Velocity</a>.
			</p>
			<p>Start out as the captain of a tiny spaceship and choose what to do to work your way up from there. Explore other star systems. Earn money by trading, carrying passengers, or completing missions. Use your earnings to buy a better ship or to upgrade the weapons and engines on your current one. Take sides in a civil war or leave human space behind and hope to find some friendly aliens. There are several different storylines, both major and minor, covering human and alien space and more missions are added in every update.</p>
			<p>The game was created by Michael Zahniser and development is being continued by the community. The game is free and open source and is available on <a href="https://store.steampowered.com/app/404410/Endless_Sky/">Steam</a>, <a href="https://www.gog.com/en/game/endless_sky">GOG</a>, <a href="https://github.com/endless-sky/endless-sky/releases">Github</a>, or <a href="https://flathub.org/apps/details/io.github.endless_sky.endless_sky">Flathub</a>. An unofficial Android port is also available on <a href="https://f-droid.org/en/packages/com.github.thewierdnut.endless_mobile/">F-Droid</a>. It is very easy to mod or contribute to the game.
			</p>
			<p>If you're a new player, you can check out the {/*todo*/} guides.</p>
			<p>There is also a <a href="https://discord.gg/ZeuASSx">Discord</a> server for Endless Sky where you can find advice or chat with the community.
			</p>
			<p>See the <a href="https://discord.gg/du27FkN5jy">ES Wikia Discord</a> if you want to talk about the wiki.
			</p>
		</section>
		<section>
			<h2>Recent game activity</h2>
			{changelog}
		</section>
	</>;
}

export default Home;