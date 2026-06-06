import Mod from "@wayward/game/mod/Mod";

export default class MyWaywardMod extends Mod {

	public override onLoad(): void {
		this.log.info("Custom Mod loaded.");
	}

	public override onUnload(): void {
		this.log.info("Custom Mod unloaded.");
	}
}
