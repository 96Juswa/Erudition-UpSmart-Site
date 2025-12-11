import ButtonIcon from "./ButtonIcon";
import TextLink from "./TextLink";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { TwitterX } from "./TwitterX";

export default function Footer() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center p-10 bg-[#094074] text-white">
        <div className="text-white">
          <h1 className="text-[#c89933] text-xl">
            UP<span className="text-white">SMART</span>
          </h1>
        </div>
        <div className="flex gap-2 pt-5 ">
          <ButtonIcon
            icon={Facebook}
            className="!text-[#094074] bg-[#c89933] hover:bg-white"
          />
          <ButtonIcon
            icon={TwitterX}
            className="!text-[#094074] bg-[#c89933] hover:bg-white"
          />
          <ButtonIcon
            icon={Instagram}
            className="!text-[#094074] bg-[#c89933] hover:bg-white"
          />
          <ButtonIcon
            icon={Youtube}
            className="!text-[#094074] bg-[#c89933] hover:bg-white"
          />
        </div>
        <div className="flex gap-5 pt-5">
          <TextLink
            text="HOME"
            className="text-white hover:text-[#c89933]"
            source="/"
          />

          <TextLink
            text="SIGNUP"
            className="text-white hover:text-[#c89933]"
            source="/signup"
          />
          <TextLink
            text="LOGIN"
            className="text-white hover:text-[#c89933]"
            source="/login"
          />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-2 bg-[#c89933] text-black">
        <p className="text-xs">Copyright &copy;2025 | Erudition</p>
      </div>
    </div>
  );
}
