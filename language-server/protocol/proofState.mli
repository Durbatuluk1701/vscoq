(**************************************************************************)
(*                                                                        *)
(*                                 VSCoq                                  *)
(*                                                                        *)
(*                   Copyright INRIA and contributors                     *)
(*       (see version control and README file for authors & dates)        *)
(*                                                                        *)
(**************************************************************************)
(*                                                                        *)
(*   This file is distributed under the terms of the MIT License.         *)
(*   See LICENSE file.                                                    *)
(*                                                                        *)
(**************************************************************************)
open Settings

type t [@@deriving yojson]

type minifiedT [@@deriving yojson]

val minify_proof : t -> minifiedT

val get_proof : previous:Vernacstate.t option -> Goals.Diff.Mode.t -> Vernacstate.t -> int -> t option