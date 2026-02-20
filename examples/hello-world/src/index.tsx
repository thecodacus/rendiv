import React from "react";
import { setRootComponent, Composition, Folder } from "rendiv";
import { HelloWorld } from "./HelloWorld";
import { SeriesDemo } from "./SeriesDemo";
import { ShowcaseDemo } from "./ShowcaseDemo";

const Root: React.FC = () => {
	return (
		<>
			<Folder name="Demos">
				<Composition id="ShowcaseDemo" component={ShowcaseDemo} durationInFrames={495} fps={30} width={1920} height={1080} />
				<Composition id="SeriesDemo" component={SeriesDemo} durationInFrames={270} fps={30} width={1920} height={1080} />
				<Composition id="HelloWorld" component={HelloWorld} durationInFrames={90} fps={30} width={1920} height={1080} />
			</Folder>
		</>
	);
};

setRootComponent(Root);
