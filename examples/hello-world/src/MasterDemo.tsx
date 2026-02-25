import React from "react";
import { Series, CanvasElement } from "@rendiv/core";
import { HelloWorld } from "./HelloWorld";
import { SeriesDemo } from "./SeriesDemo";
import { TransitionsDemo } from "./TransitionsDemo";
import { ShowcaseDemo } from "./ShowcaseDemo";

export function MasterDemo(): React.ReactElement {
	return (
		<CanvasElement id="MasterDemo">
			<Series>
				<Series.Sequence durationInFrames={90}>
					<HelloWorld />
				</Series.Sequence>
				<Series.Sequence durationInFrames={270}>
					<SeriesDemo />
				</Series.Sequence>
				<Series.Sequence durationInFrames={280}>
					<TransitionsDemo />
				</Series.Sequence>
				<Series.Sequence durationInFrames={690}>
					<ShowcaseDemo />
				</Series.Sequence>
			</Series>
		</CanvasElement>
	);
}
