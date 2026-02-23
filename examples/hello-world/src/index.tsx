import React from "react";
import { setRootComponent, Composition, Folder } from "@rendiv/core";
import { HelloWorld } from "./HelloWorld";
import { SeriesDemo } from "./SeriesDemo";
import { ShowcaseDemo } from "./ShowcaseDemo";
import { TransitionsDemo } from "./TransitionsDemo";
import { OffthreadVideoDemo } from "./OffthreadVideoDemo";
import { NoiseDemo } from "./NoiseDemo";
import { ShapesDemo } from "./ShapesDemo";
import { MotionBlurDemo } from "./MotionBlurDemo";
import { FontsDemo } from "./FontsDemo";
import { LottieDemo } from "./LottieDemo";
import { ThreeDemo } from "./ThreeDemo";
import { GifDemo } from "./GifDemo";
import { CaptionsDemo } from "./CaptionsDemo";
import { VideoSequencesDemo } from "./VideoSequencesDemo";

const Root: React.FC = () => {
	return (
		<>
			<Folder name="Demos">
				<Composition id="VideoSequencesDemo" component={VideoSequencesDemo} durationInFrames={300} fps={30} width={1920} height={1080} />
				<Composition id="GifDemo" component={GifDemo} durationInFrames={150} fps={30} width={1920} height={1080} />
				<Composition id="CaptionsDemo" component={CaptionsDemo} durationInFrames={150} fps={30} width={1920} height={1080} />
				<Composition id="LottieDemo" component={LottieDemo} durationInFrames={120} fps={30} width={1920} height={1080} />
				<Composition id="ThreeDemo" component={ThreeDemo} durationInFrames={150} fps={30} width={1920} height={1080} />
				<Composition id="FontsDemo" component={FontsDemo} durationInFrames={150} fps={30} width={1920} height={1080} />
				<Composition id="MotionBlurDemo" component={MotionBlurDemo} durationInFrames={150} fps={30} width={1920} height={1080} />
				<Composition id="ShapesDemo" component={ShapesDemo} durationInFrames={150} fps={30} width={1920} height={1080} />
				<Composition id="NoiseDemo" component={NoiseDemo} durationInFrames={150} fps={30} width={1920} height={1080} />
				<Composition id="OffthreadVideoDemo" component={OffthreadVideoDemo} durationInFrames={180} fps={30} width={1920} height={1080} />
				<Composition id="TransitionsDemo" component={TransitionsDemo} durationInFrames={280} fps={30} width={1920} height={1080} />
				<Composition id="ShowcaseDemo" component={ShowcaseDemo} durationInFrames={690} fps={30} width={1920} height={1080} />
				<Composition id="SeriesDemo" component={SeriesDemo} durationInFrames={270} fps={30} width={1920} height={1080} />
				<Composition id="HelloWorld" component={HelloWorld} durationInFrames={90} fps={30} width={1920} height={1080} />
			</Folder>
		</>
	);
};

setRootComponent(Root);
